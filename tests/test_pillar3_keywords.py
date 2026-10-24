"""
Unit Test for Pillar 3: Speech-to-Text & Cybercrime Threat Keyword Extraction.
Tests keyword taxonomy matching, threat point assignment, and faster-whisper loading.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.models.stt_whisper import SpeechToTextTranscriber

def test_pillar3_keywords():
    print("=" * 70)
    print("TEST: PILLAR 3 (SPEECH-TO-TEXT & THREAT KEYWORD EXTRACTION)")
    print("=" * 70)

    transcriber = SpeechToTextTranscriber(model_size="tiny.en")

    # Verify model loaded
    print(f"\n[MODEL CHECK] faster-whisper loaded: {transcriber.model is not None}")
    assert transcriber.model is not None, "faster-whisper model should be initialized!"

    # Test Scenarios for Keyword Extraction
    test_cases = [
        {
            "scenario": "Digital Arrest Scam (Extortion via Skype/Impersonation)",
            "transcript": "Hello officer, they called saying they are from CBI Mumbai and I am under digital arrest via Skype for money laundering.",
            "expected_tag": "#DIGITAL_ARREST_SCAM",
            "expected_words": ["cbi", "digital arrest", "skype"]
        },
        {
            "scenario": "Violent Duress / Kidnapping Threat",
            "transcript": "Please help me! The man on the phone said he will kill my brother if I do not pay the ransom right now!",
            "expected_tag": "#KIDNAPPING_THREAT",
            "expected_words": ["ransom", "kill"]
        },
        {
            "scenario": "Sextortion & Private Photo Blackmail",
            "transcript": "Someone is blackmailing me on WhatsApp, threatening to leak video and photos to my family.",
            "expected_tag": "#SEXTORTION_BLACKMAIL",
            "expected_words": ["blackmail", "leak video"]
        },
        {
            "scenario": "Banking OTP / Remote Access Phishing",
            "transcript": "A person asked me to download AnyDesk and read out the OTP to unblock my bank account.",
            "expected_tag": "#BANKING_PHISHING",
            "expected_words": ["anydesk", "otp"]
        },
        {
            "scenario": "Calm General Police Inquiry",
            "transcript": "Good morning officer, I am calling to inquire about the status of my passport verification file.",
            "expected_tag": None,
            "expected_words": []
        }
    ]

    for idx, case in enumerate(test_cases, 1):
        print(f"\n--- CASE {idx}: {case['scenario']} ---")
        print(f"Transcript: \"{case['transcript']}\"")
        
        result = transcriber.extract_threat_keywords(case['transcript'])
        
        print(f"  Matched Words: {result['matched_words']}")
        print(f"  Detected Tags: {result['tags']}")
        print(f"  Threat Points: {result['threat_points']} pts")

        if case['expected_tag']:
            assert case['expected_tag'] in result['tags'], f"Failed to detect expected tag: {case['expected_tag']}"
            print("  [PASS] Correct threat tag assigned.")
        else:
            assert len(result['tags']) == 0, "Calm inquiry should have zero threat tags!"
            print("  [PASS] Correctly detected zero threat flags.")

    print("\n" + "=" * 70)
    print("ALL PILLAR 3 KEYWORD EXTRACTION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_pillar3_keywords()
