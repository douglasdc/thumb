#!/bin/bash
rm -rf *.jpg

ffmpeg -loglevel -i sample_1280x720.mp4 -frames:v 1 -q:v 0 -vf scale=w='if(gte(ih\, iw)\, 128\, -1)':h='if(gte(iw\, ih)\, 128\, -1)',crop=128:128 -f image2 pipe:1
# ffmpeg -i thumb_128x128.jpg -frames:v 1 -vf scale=64:64 thumb_64x64.jpg
# ffmpeg -i thumb_64x64.jpg -frames:v 1 -vf scale=32:32 thumb_32x32.jpg


# ffmpeg -i sample_1280x720.mp4 -frames 1 -vf scale=w='if(gte(ih\, iw)\, 128\, -1)':h='if(gte(iw\, ih)\, 128\, -1)',crop=128:128,scale=64:64[ee],[ee]scale=32:32 img.jpg

# ffmpeg -y -f lavfi -i smptehdbars=rate=25:size=1920x1080 -filter_complex "[0:v]drawtext=text=text1:x=100/2:y=100:fontsize=50:fontfile=arial.ttf,split[txt1][txt1out];[txt1]drawtext=text=text2:x=200/2:y=200:fontsize=50:fontfile=arial.ttf,split[txt2][txt2out];[txt2]drawtext=text=text3:x=300/2:y=300:fontsize=50:fontfile=arial.ttf,split[txt3][txt3out];[txt3]drawtext=text=text4:x=400/2:y=400:fontsize=50:fontfile=arial.ttf[txt4]" -t 10 -map "[txt1out]" mapping1.mp4 -t 10 -map "[txt2out]" mapping2.mp4 -t 10 -map "[txt3out]" mapping3.mp4 -t 10 -map "[txt4]" mapping4.mp4