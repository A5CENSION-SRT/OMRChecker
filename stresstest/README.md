# OMR Grading System - Stress test

### Roadmap: 
- [x] Import and configure omr autofill
- [ ] Implement config and fill for answers too.
- [ ] Script to generate omr files (structured or random data, lets see)
- [ ] Post: script to check input data and output data
- [ ] web ui for all this?

### Building and running:

1. Install dependencies:

```
npm install
```

2. Build the ts files (should build to `./dist`): 

```
npm run build
```

3. Generate 500 omr sheets

```
npm run generate
```

See the output in `output` folder.