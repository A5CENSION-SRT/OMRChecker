"""
OMRChecker Processing Wrapper
Integrates the existing OMRChecker library for image processing
"""
import sys
import json
import cv2
from pathlib import Path
from datetime import datetime
from typing import Dict, Tuple, Optional

# Import OMRChecker modules
from src.template import Template
from src.evaluation import EvaluationConfig
from src.utils.parsing import get_concatenated_response, open_config_with_defaults
from src.core import ImageInstanceOps

from backend.config import TEMPLATE_JSON, ANSWER_KEY_JSON, CONFIG_JSON


class OMRProcessor:
    """Wrapper class for OMRChecker processing"""
    
    def __init__(self):
        """Initialize with hardcoded template and answer key"""
        self.template_path = TEMPLATE_JSON
        self.answer_key_path = ANSWER_KEY_JSON
        self.config_path = CONFIG_JSON
        
        # Load configuration
        self.tuning_config = open_config_with_defaults(self.config_path)
        
        # Load template
        self.template = Template(self.template_path, self.tuning_config)
        
        # Load evaluation config
        self.evaluation_config = None
        if self.answer_key_path.exists():
            self.evaluation_config = EvaluationConfig(
                self.template_path.parent,
                self.answer_key_path,
                self.template,
                self.tuning_config
            )
    
    def check_usn(self, usn: str) -> str:
        message = ""

        if len(usn) > 10:
            message = "Error: USN has more than 10 digits"

        elif len(usn) < 10:
            message = "Error: USN has lesse than 10 digits"

        elif usn == "":
            message = "Error: USN is empty"
        
        return message

    def process_omr_image(
        self, 
        image_path: Path,
        save_marked_image: bool = True,
        output_dir: Optional[Path] = None
    ) -> Dict:
        """
        Process a single OMR image
        
        Args:
            image_path: Path to OMR image file
            save_marked_image: Whether to save the marked image
            output_dir: Directory to save marked image
        
        Returns:
            Dictionary with results including responses, score, etc.
        """
        try:
            # Read image
            in_omr = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
            
            if in_omr is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Reset save images
            self.template.image_instance_ops.reset_all_save_img()
            self.template.image_instance_ops.append_save_img(1, in_omr)
            

            processed_omr = self.template.image_instance_ops.apply_preprocessors(
                str(image_path), in_omr, self.template
            )
            
            if processed_omr is None:
                return {
                    "status": "failed",
                    "error": "Preprocessing failed - markers not detected",
                    "fileName": image_path.name
                }
            
            # Read OMR response
            file_id = image_path.name  # Use full filename with extension
            save_dir = output_dir if output_dir else image_path.parent
            
            (
                response_dict,
                final_marked,
                multi_marked,
                _,
            ) = self.template.image_instance_ops.read_omr_response(
                self.template,
                image=processed_omr,
                name=file_id,
                save_dir=save_dir if save_marked_image else None
            )
            
            # Get concatenated responses
            omr_response = get_concatenated_response(response_dict, self.template)
            omr_response["rollNumber"] = "1RV" + omr_response["rollNumber"]
            print("YO ROLL NUMBER SPOFJPSODJFPSDJFPOSJD PFSPDOFJPSO  ", omr_response)
            
            # Evaluate if answer key exists
            score = 0
            max_score = 0
            evaluated_responses = {}
            
            if self.evaluation_config:
                from src.evaluation import evaluate_concatenated_response
                
                score = evaluate_concatenated_response(
                    omr_response,
                    self.evaluation_config,
                    image_path,
                    save_dir
                )
                
                # Get max score from evaluation config
                max_score = self._calculate_max_score()
                
                # Get detailed evaluation
                evaluated_responses = self._evaluate_responses(omr_response)
            
            # Count response statistics
            total_questions = len(omr_response) - 1

            correct = sum(1 for r in evaluated_responses.values() if r.get("verdict") == "correct")
            incorrect = sum(1 for r in evaluated_responses.values() if r.get("verdict") == "incorrect")
            unmarked = sum(1 for v in omr_response.values() if v == "" or v is None)
            print("--------------------------------------------------------------")
            print("total = ", total_questions)
            print("correct = ", correct)
            print("incorrect = ", incorrect)
            print("unmarked = ", unmarked)
            print("evaluated resp = ", evaluated_responses)

            print("--------------------------------------------------------------")
            
            # Save marked image path
            marked_image_path = None
            if save_marked_image and output_dir:
                marked_image_path = output_dir / f"{file_id}_marked.jpg"
                if not marked_image_path.exists():
                    marked_image_path = output_dir / f"{file_id}.jpg"
            
            return {
                "status": "completed",
                "fileName": image_path.name,
                "rollNumber": omr_response.get("rollNumber", ""),
                "totalQuestions": total_questions,
                "correct": correct,
                "incorrect": incorrect,
                "unmarked": unmarked,
                "responses": omr_response,
                "evaluatedResponses": evaluated_responses,
                "score": round(score, 2),
                "maxScore": max_score,
                "percentage": round((score / max_score * 100) if max_score > 0 else 0, 2),
                "multiMarked": multi_marked > 0,
                "processedAt": datetime.now().isoformat(),
                "error": self.check_usn(omr_response.get("rollNumber", ""))
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "fileName": image_path.name,
                "error": str(e),
                "processedAt": datetime.now().isoformat()
            }
    
    def _calculate_max_score(self) -> int:
        """Calculate maximum possible score from evaluation config"""
        if not self.evaluation_config:
            return 0
        
        # Get number of questions from evaluation config
        num_questions = len(self.evaluation_config.questions_in_order)
        
        # Get default marking scheme
        if hasattr(self.evaluation_config, 'default_marking_scheme'):
            default_scheme = self.evaluation_config.default_marking_scheme
            correct_marks = default_scheme.marking.get("correct", 1)
            max_score = num_questions * correct_marks
        else:
            # Fallback: assume 1 mark per question
            max_score = num_questions
        
        return max_score
    
    def _evaluate_responses(self, omr_response: Dict) -> Dict:
        """Get detailed evaluation for each response"""
        evaluated = {}
        
        if not self.evaluation_config:
            return evaluated

        question_to_answer_matcher = self.evaluation_config.question_to_answer_matcher
        
        # Evaluate each response using the answer matcher
        for question, marked_answer in omr_response.items():
            if question not in question_to_answer_matcher:
                # Skip if no answer key for this question
                continue

            answer_matcher = question_to_answer_matcher[question]
            question_verdict, delta = answer_matcher.get_verdict_marking(marked_answer)

            evaluated[question] = {
                "marked": marked_answer,
                "correct": str(answer_matcher.answer_item),
                "verdict": question_verdict,
                "score": delta,
                "answerType": answer_matcher.answer_type
            }
        
        return evaluated


# Global processor instance
omr_processor = None


def get_omr_processor() -> OMRProcessor:
    """Get or create OMR processor singleton"""
    global omr_processor
    if omr_processor is None:
        omr_processor = OMRProcessor()
    return omr_processor