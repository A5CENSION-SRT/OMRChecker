# OMR Grading System - Stress test

### Roadmap: 
- [x] Import and configure omr autofill
- [x] Implement config and fill for answers too.
- [x] Script to generate omr files (structured or random data, lets see)
- [x] Post: script to check input data and output data
- [ ] add cli args to parse instead of hardcoding the values in the files

### Building and running:

1. Generate mock omr files: 

Change `sheet_count` in line 144 of `omr_generate.py`: 
```python
generate_dummy_omr_images(sheet_count=3, logo_path="rvce_logo.png")
```

run:

```sh
python omr_generate.py
```

2. Validate read answers to generated answers: 

Change lines 6 in `omr_validate.py` to point to the path of generated omr batch.

run it: 

```sh
python omr_validate.py
```
