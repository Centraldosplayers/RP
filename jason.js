(function($){
    "use strict";
    
    $(".jd_player").append('<div class="jd_content">' +
                '<div class="jd_header"><div class="jd_station_name">Station Radio Name</div><div class="jd_live">OffLine</div></div>' +
                '<div class="jd_section">'+
                '<div class="jd_col_l">'+
                '<div class="jd_artist_img"></div>'+
                '</div>'+
                '<div class="jd_col_r">'+
                '<div class="jd_nowplaying_img">'+
                '<span class="jd_track_art">Artist name</span>'+
                '<div class="jd_track_title_img">NowPlaying Song Name</div>'+
                '</div>'+
                '<div class="jd_clock">'+
                '<div class="jd_clock_inner"><span class="fas fa-clock"></span><div id="clock"></div></div>'+
                '<div class="jd_day"><span class="fas fa-calendar-alt"></span><h2 id="day">SunDay</h2></div><div class="jd_date">30 MARCH 2020</div></div>' +
                '<div class="jd_spectrum"><canvas class="jd_canvas"></canvas></div>'+
                '</div>'+
                '</div>'+
                '<div class="jd_article"><div class="jd_nowplaying"><h1 class="jd_track_title">NowPlaying Song Name</h1></div><span class="jd_track_artist">Artist name</span></div>' +
                '<div class="jd_footer"><div class="jd_infor_station"><ul class="jd_list">'+
                '<li class="jd_item"><h2 class="jd_listen">Listener: <span class="jd_desc" id="listener">10</span></h2></li>'+
                '<li class="jd_item"><h2 class="jd_listen">Current Listener: <span class="jd_desc" id="current_listener">10</span></h2></li>'+
                '<li class="jd_item"><h2 class="jd_listen">Genre: <span class="jd_desc" id="genre">Dance</span></h2></li>'+
                '<li class="jd_item"><h2 class="jd_listen">Station: <span class="jd_desc" id="station">Station Name</span></h2></li>'+
                '</ul></div>'+
                '<div class="jd_nav">'+
                '<div class="jd_social">'+
                '<a class="jd_btn_social" id="facebook" href="#" target="_blank">Facebook</a>'+
                '<a class="jd_btn_social" id="twitter" href="#" target="_blank">Twitter</a>'+
                '<a class="jd_btn_social" id="youtube" href="#" target="_blank">Youtube</a>'+
                '<a class="jd_btn_social" id="site" href="#" target="_blank">Site</a>'+
                '</div>'+
                '<div class="jd_control"><div class="jd_btn_play"><span class="fas fa-play" id="btn_play"></span></div>'+
                '<div class="jd_box_volume">'+
                '<span class="fas fa-volume-down"></span>'+
                '<div class="jd_volume" id="volume">'+
                '<span class="jd_progressbar"><span id="vol_progressbar"></span></span>'+
                '<input type="range" min="0" max="100" step="1" value="100" class="jd_slider" id="volume_bar" role="progressbar">'+
                '</div>'+
                '<span class="fas fa-volume-up"></span>'+
                '</div>'+
                '</div>'+
                '</div>'+
                '</div>'+
                '</div>');

    $.fn.jd_player = function (options) {
        var settings = $.extend({
            type:"",
            URL:"",
            lastFMkey:"665b8ff2830d494379dbce3fb3b218a9",
            mount_point:"",
            cors_proxy:"",
            stream_id:1,
            streampath:"/;stream.mp3?icy=http",
            radio_logo:"",
            default_image:"https://i.postimg.cc/wxVt2PHR/default-image.jpg",
            autoplay:true,
            context: new AudioContext(),
            freqData: null,
            audioAgain: null,
            source: null,
            analyser: null,
            fxBox: null,
            ctx: null,
            cv_w: 160,
            cv_h: 100,
            volume: 0.5,
            facebook: 'https://facebok.com/',
            twitter: 'https://twitter.com/',
            youtube: 'https://youtube.com',
            site: 'https://www'
        }, options);

        var thisObj;
        thisObj = this;
        var audio;
        var ppBtn = $("#btn_play", thisObj);

        var canvas = document.querySelector(".jd_canvas");
        var ctx = canvas.getContext('2d');
        var bar_w, bar_h;
        canvas.width = settings.cv_w;
        canvas.height = settings.cv_h;

        audio = new Audio();
        audio.preload = "auto";
        audio.volume = settings.volume;

        thisObj.each(function (){
            if(settings.autoplay){
                audio.autoplay = true;
                //setupAudio();
            }
            ShareImplementation();

            if(settings.type.toLowerCase() == "shoutcast"){
                audio.src = settings.URL + settings.streampath;
                audio.crossOrigin = "anonymous";
                //audio.load();
                var dataURL = settings.URL + "/stats?sid=" + 
                settings.stream_id + "&json=1&callback=?";
                var hisURL = settings.URL + "/played?sid=" + 
                settings.stream_id + "&type=json&callback=?";

                updateSH(dataURL, hisURL);
            }
        });

        $(audio).on("playing", function(){
            togglePlying(ppBtn, true);
            $(ppBtn).addClass("fa-stop");
            $(ppBtn).removeClass("fa-play");
            $(".jd_live", thisObj).text("OnLine");
        });
        $(audio).on("pause", function(){
            $(ppBtn).addClass("fa-play");
            $(ppBtn).removeClass("fa-stop");
            $(".jd_live", thisObj).text("OffLine");
        });
        $(ppBtn, thisObj).on("click tap", function(){
            playManagement();
        });
        //setupAudio();
        function setupAudio(){
            settings.source = settings.context.createMediaElementSource(audio);
            settings.audioAgain = settings.context.createGain();
            settings.analyser = settings.context.createAnalyser();
            //conect
            settings.source.connect(settings.audioAgain);
            settings.source.connect(settings.analyser);
            settings.audioAgain.connect(settings.context.destination);
            //audio.volume = 0.5;
            initAnimation();
            setVolume(settings.volume);

            audio.addEventListener('waiting', function(){
                settings.autoplay = false;
            });

            audio.addEventListener('playing', function(){
                settings.autoplay = true;
                audio.play();
                settings.freqData = new Uint8Array(settings.analyser.frequencyBinCount);
            });

            audio.addEventListener('ended', function(){
                settings.autoplay = false;
            });
            initAnimation();
        }

        function togglePlying(elem, bool){
            $(elem).toggleClass("playing", bool);
        }

        function setVolume(volume){
            if(!settings.audioAgain) return;
            volume = (volume < 0) ? 0 : volume;
            volume = (volume > 1) ? 1 : volume;
            settings.audioAgain.gain.value = volume;
        }

        function playManagement(){
            if(audio.paused){
                setTimeout(function(){
                    audio.play();
                }, 150);

                var $playing = $('#btn_play.playing');
                if($(thisObj).find($playing).length === 0){
                    $playing.click();
                }
            } else {
                audio.pause();
                //audio.currentTime = 1;
            }
        }
        
        function getReadableTime(value){
            if(value == "Infinity"){
                return "live";
            } else {
                var durmins = Math.floor(value / 60);
                var dursecs = Math.floor(value - durmins * 60);
                if(dursecs < 10){dursecs = "0" + dursecs;}
                if(durmins < 10){durmins = "0" + durmins;}

                return durmins + ":" + dursecs + " / ";
            }
        }

        function splitter(text, ref){
            if(text === undefined){
                text = "undefined - undefined";
            }
            if(text.indexOf('-') > -1){
                var [artist, title] = text.split(/-(.+)?/);
                if(ref == "artist"){
                    return artist.trim();
                }
                else if(ref == "title"){
                    return title.trim();
                }
            } else {
                console.log("The track name is not separated by - (dash)!");
                if(ref == "artist"){
                    return "";
                }
                else if(ref == "title"){
                    return text;
                }
            }
        }

        function updateArtist(name){
            $(".jd_track_artist", thisObj).attr("data-text", name).text(textShortener(name, 25));
            $(".jd_track_art", thisObj).attr("data-text", name).text(textShortener(name, 25));
        }

        function updateTitle(name){
            $(".jd_track_title", thisObj).attr("data-text", name).text(textShortener(name, 25));
            $(".jd_track_title_img", thisObj).attr("data-text", name).text(textShortener(name, 25));
        }

        function updateTag(data){
            $(thisObj).attr("data-tag", data);
        }

        function getImage(artist){
            artist = prepareArtistName(artist);
            artist = encodeURI(artist);
            var url = "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=" + 
            artist + "&api_key=" + settings.lastFMkey + "&format=json";
            $.getJSON(url, function (data){
                var image = settings.default_image;
                if(data.error){
                    console.log(data.message);
                    console.log("The above error is for" + encodeURI(artist));
                }
                else if(data.artist.image[data.artist.image.length - 1]["#text"].length > 0){
                    image = data.artist.image[data.artist.image.length - 1]["#text"];
                }
                else{
                    console.log("No image is associated with \'" + decodeURI(artist) + "\' on last.FM!")
                }
                $(".jd_artist_img", thisObj).css("background-image", "url(" + image + ")");
            })
            .error(function(){
                console.log("#getImage(), Error in loading artist background image for " + decodeURI(artist));
            });
        }

        function getTag(){
            return $(thisObj).attr("data-tag");
        }

        function updateSH(url, history){
            setInterval(function (){
                $.getJSON(url, function (data){
                    if(data.sontitle != getTag()){
                        updateTag(data.songtitle);
                        var artist = splitter(data.songtitle, "artist");
                        var title = splitter(data.songtitle, "title");
                        updateArtist(artist);
                        updateTitle(title);
                        getImage(artist);

                        updateServerInfoSH(data);
                    }
                })
                .error(function (){
                    console.log("Error, in loading Shoutcast" + url);
                });
            }, 750);
        }

        function getTime(unixtimestamp){
            var dt = eval(unixtimestamp * 1000);
            var myDate = new Date(dt);
            var mt = myDate.toTimeString();
            return "<span class='playedAt'>" + mt.substring(0, 9) + "</span>";
        }

        function updateServerInfoSH(data){
            $(".jd_station_name", thisObj).text(data.servertitle);
            $("#station", thisObj).text(data.servertitle);
            $("#listener", thisObj).text(data.peaklisteners);
            $("#current_listener", thisObj).text(data.currentlisteners);
            
            let result = [];
            Object.keys(data).forEach(key => {
                if(/servergenre/.test(key)){
                    result.push(data[key])
                }
            });
            for(var i = 0; i < result.length; i++){
                if(result[i] !== ""){
                    $("#genre", thisObj).text(result[i])
                }
            }
        }

        function prepareArtistName(artist){
            artist = artist.toLowerCase();
            if(artist.includes("&")){
                artist = artist.replace('&', 'and');
            }
            else if(artist.includes("feat")){
                artist = artist.substr(0, artist.indexOf('feat'));
            }
            else if(artist.includes("ft")){
                artist = artist.substr(0, artist.indexOf('ft'));
            }
            return artist;
        }        

        function ShareImplementation(){
            $("#facebook", thisObj).attr("href", settings.facebook);
            $("#twitter", thisObj).attr("href", settings.twitter);
            $("#youtube", thisObj).attr("href", settings.youtube);
            $("#site", thisObj).attr("href", settings.site);
        }

        function textShortener(text, length){
            if(text.length > length){
                return text.substring(0, length - 1) + "...";
            }else{
                return text;
            }
        }

        function initCanvas(){
            settings.fxBox = getBoundingClientRect();
            var canvas = document.querySelector(".jd_canvas");
            settings.ctx = canvas.getContext('2d');
            canvas.width = settings.cv_w;
            canvas.height = settings.cv_h;
        }

        function initAnimation(){
            window.requestAnimationFrame(initAnimation);
            settings.freqData = new Uint8Array(settings.analyser.frequencyBinCount);
            settings.analyser.getByteFrequencyData(settings.freqData);
            ctx.clearRect(0, 0, settings.cv_w, settings.cv_h);

            for(var i = 0; i < settings.analyser.frequencyBinCount; i++){
                var bar_x = i * 3;
                bar_h = 2;
                bar_h = -(settings.freqData[i] / 4.8);

                ctx.fillRect(bar_x, settings.cv_h, bar_w, bar_h);
            }
            console.log(bar_h);
        }
        //initAnimation();
        var sVolume = document.querySelector('#volume_bar');
        sVolume.addEventListener('change', function(){
            audio.volume = sVolume.value / 100;
        });
        var progress = document.querySelector("#vol_progressbar");
        sVolume.addEventListener('input', changeMove);
        function changeMove(){
            var val = sVolume.value;
            progress.style.width = val + "%";
        }

        function initClear(){
            setInterval(function(){
                console.clear();
            }, 10000);
        }

        function clockTime(){
            var lang = navigator.language;
            var date = new Date();
            var day = date.getDate();
            var dayName = date.toLocaleString(lang, {weekday: 'long'});
            var month = date.getMonth();
            var monthName = date.toLocaleString(lang, {month: 'long'});
            var year = date.getFullYear();
            var hr = date.getHours();
            var mn = date.getMinutes();
            var sc = date.getSeconds();

            if(hr < 10){hr = "0" + hr}else{hr = hr};
            if(mn < 10){mn = "0" + mn}else{mn = mn};
            if(sc < 10){sc = "0" + sc}else{sc = sc};
            if(day < 10){day = "0" + day}else{day = day};

            $("#clock", thisObj).text(`${hr}:${mn}:${sc}`);
            $("#day", thisObj).text(dayName);

            var calendar = document.querySelector(".jd_date");
            var form = `<span>${day}</span>`+
            `<span>${monthName}</span>`+
            `<span>${year}</span>`;

            calendar.innerHTML = form;
        }
        window.setInterval(clockTime, 1000);
        
    console.log("ok!");
    initClear();
    };

})(jQuery);