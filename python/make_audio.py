import os
import sys
import json
from pathlib import Path

import azure.cognitiveservices.speech as speechsdk

with open("data/info.json", 'r', encoding='utf-8') as file:
    info = json.load(file)

# Replace with your subscription key and service region
subscription_key = info.subscription_key
region = info.region

lang_list : list[tuple[str, str]] = [
    ("ara", "ar-EG", "SalmaNeural"),
    ("chi", "zh-CN", "XiaoxiaoNeural"),
    ("eng", "en-US", "AriaNeural"), # JennyNeural
    ("fre", "fr-FR", "DeniseNeural"),
    ("ger", "de-DE", "KatjaNeural"),
    ("hin", "hi-IN", "AnanyaNeural"),
    ("ind", "id-ID", "GadisNeural"),
    ("jpn", "ja-JP", "AoiNeural"), # NanamiNeural AoiNeural MayuNeural ShioriNeural
    ("kor", "ko-KR", "SunHiNeural"),
    ("rus", "ru-RU", "SvetlanaNeural"),
    ("spa", "es-ES", "ElviraNeural"),
    ("por", "pt-PT", "RaquelNeural")
]

lang_dic = {
    "ara" : "ara",
    "chi" : "chi",
    "eng" : "eng",
    "fre" : "fra",
    "ger" : "ger",
    "hin" : "hin",
    "ind" : "ind",
    "jpn" : "jpn",
    "kor" : "kor",
    "rus" : "rus",
    "spa" : "spa",
    "por" : "por",
}










lang_list2 = [x[:2] for x in lang_list]
lang_dict = dict(lang_list2)

voice_dict = dict( [x[1:] for x in lang_list] )

def text_to_speech(num_text : list[tuple[int, str]], code3, voice_name):
    target_dir = f'../../firebase.ts/public/lib/i18n/audio/{code3}'

    # Initialize the speech configuration
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)

    speech_config.speech_synthesis_voice_name = voice_name
    speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3)
    # speech_synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)


    for num, text in num_text:
        output_filename = f'{target_dir}/{num}.mp3'

        audio_config = speechsdk.audio.AudioOutputConfig(filename=output_filename)

        # Initialize the synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)

        # Synthesize the text to speech
        result = synthesizer.speak_text_async(text).get()

        # Check the result
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            print(num, text)
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            print(f"Speech synthesis canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                if cancellation_details.error_details:
                    print(f"Error details: {cancellation_details.error_details}")
            print("Did you set the speech resource key and region values correctly?")


def list_voices(lang_code : str):
    # Initialize the speech configuration
    speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)

    # Create the synthesizer
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config)

    # Get the list of voices
    voices_result = synthesizer.get_voices_async().get()

    short_voice_name = voice_dict[lang_code]

    voice_name = None
    if voices_result.reason == speechsdk.ResultReason.VoicesListRetrieved:
        voices = voices_result.voices
        for voice in voices:
            if voice.locale == lang_code and voice.gender == speechsdk.SynthesisVoiceGender.Female:
                k1 = voice.name.find(lang_code)
                if k1 == -1:
                    print(f"Name: {voice.name}, Locale: {voice.locale}, Gender: {voice.gender}, Voice Path: {voice.voice_path}")
                else:
                    k1 += 6
                    k2 = str(voice.name).find(")", k1)
                    name = str(voice.name)[k1:k2].strip()
                    print(f"{name}")

                    if short_voice_name == name:
                        voice_name = voice.name
    else:
        print(f"Failed to retrieve voices. Error details: {voices_result.error_details}")

    print(f"select the voice. [{short_voice_name}] => [{voice_name}]")
    return voice_name


def make_audio_files(mode, code3, voice_name):
    text_path = f"../../i18n.ts/public/lib/i18n/translation/{code3}.txt"
    with open(text_path, 'r', encoding='UTF-8') as f:
        lines = f.readlines()

    num_text = []
    for line in lines:
        line = line.strip()
        if line == "":
            continue

        # print(f"[{line}]")
        [num, text] = line.split(":")
        num  = num.strip()
        text = text.strip()
        # if int(num) < 23:
        if int(num) != 37:
            continue

        num_text.append([num, text])

    if mode == 1:
        num_text = num_text[:1]
    elif mode == 2:
        num_text = num_text[1:10]
    elif mode == 3:
        num_text = num_text[10:]
    else:
        return
    
    text_to_speech(num_text, code3, voice_name)


if __name__ == '__main__':
    args = sys.argv
    if len(args) == 3:

        code3      = args[1]
        mode       = int(args[2])
        lang_code  = lang_dict[code3]
        short_voice_name = voice_dict[lang_code]

        voice_name = list_voices(lang_code)
        print(code3, lang_code, short_voice_name, voice_name)

        if voice_name is not None and 0 < mode:
            make_audio_files(mode, code3, voice_name)

