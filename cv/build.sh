#!/bin/sh
cd "$(dirname "$0")/.." && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --print-to-pdf=NghiaNguyen-CV.pdf "file://$PWD/cv/cv.html"
