Add-Type -AssemblyName System.Speech

$dir = Join-Path $PSScriptRoot "sample_recordings"
if (!(Test-Path -Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force
}

$scenarios = @(
    @{
        File = "sample_digital_arrest.wav"
        Text = "Attention! This is officer Verma from CBI Cyber Crime branch Mumbai. An illegal parcel in your name containing narcotics and fake passports was intercepted at customs. You are under digital arrest! Do not disconnect this Skype video call or local police will raid your house immediately. You must transfer forty thousand rupees as clearance security."
    },
    @{
        File = "sample_kidnap_threat.wav"
        Text = "Listen to me very carefully! We have your child. Do not call the police or tell anyone or we will hurt him with a weapon! You have thirty minutes to pay five lakh rupees ransom or you will never see him again!"
    },
    @{
        File = "sample_routine_bank.wav"
        Text = "Hello officer, good afternoon. I am following up on my previous complaint status. I registered an online grievance number ninety eight twenty three yesterday regarding an unauthorized SMS notification from my bank. Can you please verify if the FIR was recorded?"
    }
)

foreach ($sc in $scenarios) {
    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $outPath = Join-Path $dir $sc.File
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($sc.Text)
    $synth.Dispose()
    Write-Host "Generated: $outPath"
}
