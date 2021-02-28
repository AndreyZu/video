const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');

const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath("bin/ffmpeg.exe");
ffmpeg.setFfprobePath("bin/ffprobe.exe");
ffmpeg.setFlvtoolPath("flvtool");
// console.log(ffmpeg);


const app = express ();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/convert', (req, res) => {
    let to = req.body.to;
    let file = req.files.file;
    let fileName = `${file.name.split('.')[0]}_new.${to}`;
    console.log(to);
    console.log(file);

    // File metadata
    let duration;
    const maxSize = 10485760;
    let size;
    let bitRate;
    let streams;
    let timecode;


    ffmpeg.ffprobe("tmp/" + file.name, function(err, metadata) {
        if (err) {
            return res.sendStatus(500).send(err);
        }

        duration = metadata.format.duration;
        size = metadata.format.size;
        bitRate = metadata.format.bit_rate;
        streams = metadata.streams;
        timecode = metadata.streams[0].timecode;
        console.log('duration: ', duration);
        console.log('size: ', size);
        console.log('bit rate: ', bitRate);
        console.log('streams: ', streams);
        console.log('timecode: ', timecode);
    });

    file.mv("tmp/" + file.name, function (err) {
        if (err) {
            return res.sendStatus(500).send(err);
        }
        console.log("File Uploaded successfully");
    });


    ffmpeg("tmp/" + file.name)
        .videoCodec('libx264')
        .fps(24)
        // .videoBitrate('1000')
        .audioCodec('aac')
        .audioFrequency(44100)
        .audioBitrate('128k')
        .audioChannels(2)

        .format(to)

        // .inputOptions(['-sn', '-dn'])
        .outputOptions(['-pix_fmt yuv420p', '-profile:v Main', '-level 4.1', '-d -1'])
        .on("error", function (err) {
            console.log("an error happened: " + err.message);
        })
        .on("end", function (stdout, stderr) {
            console.log("Finished");
            res.send('Done.');
        })
        .save(__dirname +'/convert/'+ fileName);
});
/*
ffmpeg.getAvailableCodecs(function(err, codecs) {
    console.log('Available codecs:');
    console.dir(codecs);
});
ffmpeg.getAvailableFormats(function(err, formats) {
    console.log('Available formats:');
    console.dir(formats);
});



ffmpeg.getAvailableEncoders(function(err, encoders) {
    console.log('Available encoders:');
    console.dir(encoders);
});
*/
/*
ffmpeg.getAvailableFilters(function(err, filters) {
    console.log("Available filters:");
    console.dir(filters);
});
*/
app.listen(4000);

/*
{"streams":[
    {"index":0,"codec_name":"h264","codec_long_name":"H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10","profile":"Main","codec_type":"video","codec_time_base":"1/50","codec_tag_string":"avc1","codec_tag":"0x31637661","width":1920,"height":1080,"coded_width":1920,"coded_height":1088,"closed_captions":0,"has_b_frames":1,"sample_aspect_ratio":"N/A","display_aspect_ratio":"N/A","pix_fmt":"yuv420p","level":41,"color_range":"tv","color_space":"bt709","color_transfer":"bt709","color_primaries":"bt709","chroma_location":"left","field_order":"unknown","timecode":"N/A","refs":1,"is_avc":"true","nal_length_size":4,"id":"N/A","r_frame_rate":"25/1","avg_frame_rate":"25/1","time_base":"1/25000","start_pts":0,"start_time":0,"duration_ts":375000,"duration":15,"bit_rate":1146117,"max_bit_rate":"N/A","bits_per_raw_sample":8,"nb_frames":375,"nb_read_frames":"N/A","nb_read_packets":"N/A","tags":{"creation_time":"2020-10-30T13:29:17.000000Z","language":"eng","handler_name":"\u001fMainconcept Video Media Handler","encoder":"AVC Coding"},"disposition":{"default":1,"dub":0,"original":0,"comment":0,"lyrics":0,"karaoke":0,"forced":0,"hearing_impaired":0,"visual_impaired":0,"clean_effects":0,"attached_pic":0,"timed_thumbnails":0}},
    {"index":1,"codec_name":"aac","codec_long_name":"AAC (Advanced Audio Coding)","profile":"LC","codec_type":"audio","codec_time_base":"1/44100","codec_tag_string":"mp4a","codec_tag":"0x6134706d","sample_fmt":"fltp","sample_rate":44100,"channels":2,"channel_layout":"stereo","bits_per_sample":0,"id":"N/A","r_frame_rate":"0/0","avg_frame_rate":"0/0","time_base":"1/44100","start_pts":0,"start_time":0,"duration_ts":660480,"duration":14.976871,"bit_rate":125590,"max_bit_rate":204996,"bits_per_raw_sample":"N/A","nb_frames":645,"nb_read_frames":"N/A","nb_read_packets":"N/A","tags":{"creation_time":"2020-10-30T13:29:17.000000Z","language":"eng","handler_name":"#Mainconcept MP4 Sound Media Handler"},"disposition":{"default":1,"dub":0,"original":0,"comment":0,"lyrics":0,"karaoke":0,"forced":0,"hearing_impaired":0,"visual_impaired":0,"clean_effects":0,"attached_pic":0,"timed_thumbnails":0}}
    ]
    ,"format":{"filename":"tmp/video.mp4","nb_streams":2,"nb_programs":0,"format_name":"mov,mp4,m4a,3gp,3g2,mj2","format_long_name":"QuickTime / MOV","start_time":0,"duration":15,"size":2402553,"bit_rate":1281361,"probe_score":100,"tags":{"major_brand":"mp42","minor_version":"0","compatible_brands":"mp42mp41","creation_time":"2020-10-30T13:29:16.000000Z"}},
    "chapters":[]
}
*/