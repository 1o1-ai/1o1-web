# Run overnight Gemma answer review (resume-safe). Logs to portal/data/cbse10-answer-review.log
$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot\..
python scripts/review_catalog_answers.py --provider api --delay 0.3 --checkpoint-every 10 @args
