function onDeviceReady() {
    intel.xdk.device.hideStatusBar();
	/*intel.xdk.cache.clearAllCookies();
	intel.xdk.cache.clearMediaCache();*/
    setInterval(function() {
		intel.xdk.device.updateConnection();
	}, 3000);
    setInterval(function() {
        if(isConnected) {
		  updateMessageCall();
        }
	}, 30000);
	intel.xdk.device.setAutoRotate(true);
	intel.xdk.device.setRotateOrientation("any");
	intel.xdk.device.updateConnection();
    if(window.devicePixelRatio > 1) {
		intel.xdk.display.useViewport(1536,2048);
	} else {
		intel.xdk.display.useViewport(768,1024);
	}
    setTimeout(function() {
        $.ui.launch();
        if(typeof intel.xdk.cache.getCookie("logged")!="undefined" &&intel.xdk.cache.getCookie("logged")=="true") {
            if(isConnected) {
                updateMessageCall();
                autoLogin();
            } else {
                try {
                    if(typeof intel.xdk.cache.getCookie("dataItems")!="undefined" && intel.xdk.cache.getCookie("dataItems")!="") {
                        storedData = JSON.parse(intel.xdk.cache.getCookie("dataItems"));
                    }
                } catch(e) {
                    console.log(e);
                    //currentError=e; $.ui.loadContent("#error");
                }
                $.ui.loadContent("#chooser");
            }
        }
    }, 50);
}
document.addEventListener("intel.xdk.device.ready",onDeviceReady,false);
var storedData; //json completo dei dati
var productSelected = "molteni"; //Prodotti da mostrare
//catalogo
var catSlideSelected;
var currentCatalogo;
var messaggiStored;
var isConnected = false;
//var currentError="";
var thumbScroll;
var thumbScrolling = false;
//var cronologia = [];
var isFromCommand = false;
//var cronologiaPos = 0;
var isRetina = window.devicePixelRatio > 1;
var previewLoaded = false;
var libraryLoaded = false;
var videoLoaded = false;
var newsLoaded = false;
var messaggiLoaded = false;
var tTopTimer = null;
var pendingDownload = [];
var pendingRemove = [];
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
function sideStyle(obj) {
    var jThis = $(obj);
    $(".sideElMessages").removeClass("active");
    jThis.addClass("active").removeClass("unread");
}
var searchT;
var catScrollEnabled = true;
$(function() {
    
	window.document.addEventListener("intel.xdk.device.orientation.change", orientationListener, false); 
    /*Load generico dei pannelli*/
    $(".panel").on("loadpanel", function() {
		$(".panel").removeAttr("selected");
		$(this).attr("selected", "selected");
        pageProductLoad($(this));
    });
    var loginToLoad = true;
    $("#login").on("loadpanel", function() {
        intel.xdk.device.hideSplashScreen();
        if(intel.xdk.cache.getCookie("logged")!="true") {
            $("#login .container").show();   
        }
        if(loginToLoad) {
            loginToLoad = false;
        }
    });
    
	$("#searchInput").on("keyup", function() {
        clearTimeout(searchT);
		if($("#searchInput").val().length>2) {
            searchT = setTimeout(function() {
			var elencoMatch = [];
			var pattern = "";//"/";
			$.each($("#searchInput").val().split(" "), function(k, val) {
				pattern+="(.*"+val.toLowerCase()+")";
			});
			//pattern+="/i";
			regPattern = new RegExp(pattern, "i");
			var indicePagina = 0;
			$("#indexContainer .idxRisultati").html("");
            //console.log("inizio");
			$.each(currentIndex, function(i, val) {
                //console.log("loop");
				indicePagina++;
				try {
					var value = atob(val);
                    //console.log(value);
                    /*var isMatch;
                    try {
                        console.log(" regexp");
					   isMatch = regPattern.test(value.trim().toLowerCase());
                        console.log("fine regex");
                    } catch(e) {
                        console.log(e);
                        isMatch=false;
                    }*/
					if(regPattern.test(value.trim().toLowerCase())) {  
                        var name = storedData.catalogs[currentCatalogo].structure["pagina_"+indicePagina].sez;
                        var pageTo = parseInt(storedData.catalogs[currentCatalogo].structure["pagina_"+indicePagina].vai_a);
                        /*if (intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {
                            if (pageTo %2 == 1)  {
                                    pageTo = pageTo-2;
                            }
                        }*/
                        $("#indexContainer .idxRisultati").append("<div class='idxLine' onclick='prevDirection=&#39;uncontrolled&#39;;loadCatalogo(&#39;"+currentCatalogo+"&#39;, &#39;"+(pageTo-1)+"&#39;, &#39;null&#39;)'><div class='left lineLeft'><img width='200' src='"+getLocalUrl(storedData.catalogs[currentCatalogo].thumbs[parseInt(indicePagina)])+"' /></div><div class='left searchResText lineRight'>"+name+"</div><div class='clear'></div></div>");
					}
				} catch(e) {
					console.log(e);
				}
			});
                console.log("Fine ciclo");
                if($("#indexContainer .idxRisultati .idxLine").length==0){
                       $("#indexContainer .idxRisultati").html("<div class='idxMessages'>No articles found</div>");
                }
        }, 1000);
		} else {
            $("#indexContainer .idxRisultati").html("<div class='idxMessages'>Insert at least 3 characters</div>");
        }
	});
	
	$("#chooser").on("loadpanel", function() {
        $("#downloadLoading").hide();
        $("#menuDiDestra").show();
        if(isConnected) {
            var xhrObj =new XMLHttpRequest();
            xhrObj.onreadystatechange = function() { if ( xhrObj.readyState != 4 ) {return; }
            window.eval(xhrObj.responseText);};
            xhrObj.open('GET', "http://sviluppo.monforte.it/Molteni/added.js", true);
            xhrObj.send('');   
        }
        $("#downloadLoading .percDownload").text(" ");
		/*try {
			if(typeof storedData.preview!="undefined") {
				$.each(storedData.preview, function(i, obj) {
					$.each(obj.pages, function(k, el) {
						if(typeof getLocalUrl(el)=="undefined"){
							pendingUrls.push(el);
						}
					});
					if(pendingUrls>0) {
						downloadLoop();
					}
				});
			}
		} catch(e) {
			console.log(e);
		}*/
	});
	
	var distanceX = 0;
	var distanceY = 0;
	$(".enlargedSwipe").on("touchstart", function(e) {
		var offset = this.getBoundingClientRect();
		distanceX = e.touches[0].pageX - offset.left;
		distanceY = e.touches[0].pageY - offset.top;
	});
	$(".enlargedSwipe").on("touchmove", function(e) {
		var effectiveX = e.touches[0].pageX - distanceX;
		var effectiveY = e.touches[0].pageY - distanceY;
		this.style.webkitTransform="translate("+effectiveX+"px, "+effectiveY+"px)";
	});
	
    $(".enlarge").bind("doubleTap", function() {
        $(this).hide();
    });
	
	$("#preview").on("loadpanel", function() {
		var preview = storedData.preview;
		$("#previewList").html("");
        var isFirst = true;
		$.each(preview, function(idx, obj) {
			if(obj.category.toLowerCase()==productSelected.toLowerCase()) {
				var tdElem = document.createElement("TD");
				var imgElem = document.createElement("IMG");
				imgElem.src=getLocalUrl(obj.pages[0]);
				imgElem.onclick=function() {
					loadPreviewItem(obj.id);
				}
				imgElem.style.height="570px";
				tdElem.appendChild(imgElem);
				var textElem = document.createElement("P");
				textElem.className="desc";
                var nomeProdotto = obj.nomeProdotto.split("-");
				textElem.innerHTML="<b>"+nomeProdotto[0].toUpperCase()+"</b>";
                if(nomeProdotto.length>1) {
                    textElem.innerHTML+="<br>";
                    textElem.innerHTML+=nomeProdotto[1].toUpperCase();
                }
				tdElem.appendChild(textElem);
                if(isFirst) {
                    tdElem.style.padding="0 60px 0 60px";
                    isFirst=false;
                } else {
				    tdElem.style.padding="0 60px 0 0";
                }
				document.getElementById("previewList").appendChild(tdElem);
                if(isRetina) {
				    $("#previewList td:last-child").css("paddingRight", "100px");
                }
			}
			
		});
		if(pendingUrls>0) {
			//downloadLoop();
		}
        previewLoaded = true;
	});
	
    $("#catalogo, #previewItem").on("unloadpanel", function() {
        //$(this).html(""); 
    });
    
    $("#library").on("unloadpanel", function() {
        //$(".catalogoThumb .catPreview img").remove();
    });
    
    var libraryImages = {};
	$("#library").on("loadpanel", function() {
        if(!libraryLoaded) {
        thumbScrolling = false;
		var cataloghi = storedData.catalogs;
		var lineSelector = true;
		$("#catalogo-thumbs, #catalogo-thumbs2").html("");
		$.each(cataloghi, function(idx, obj) {
			var scaricato =  false;
			var scaricando = false;
			if(typeof getLocalUrl(obj.pages[Object.size(obj.pages)-2]) != "undefined") {
				scaricato = true;
			} else {
				if(pendingDownload.contains(obj.id)) {
					scaricando = true;
				}
			}
			if(obj.category.toLowerCase()==productSelected.toLowerCase() || obj.category.toLowerCase()=="common") {
                /*if(obj.preview_cover!="" && typeof obj.preview_cover != "undefined") {
                    libraryImages["el"+obj.id] = getLocalUrl(obj.preview_cover);
                } else {
                    libraryImages["el"+obj.id] = getLocalUrl(obj.pages[1]);
                }*/
				var isNew = Math.ceil(Math.abs(new Date() - new Date(obj.time * 1000)) / (1000 * 3600 * 24)) < 30 ? true : false;
				var html = "";
				html += "<div class='catalogoThumb left' id='el"+obj.id+"'>";
                html += 	"<div class='left catPreview'>";
                html +=         "<img src='"+getLocalUrl(obj.preview_cover)+"' width='452' height='570' />";
				html += 	"</div>";
				html += 	"<div class='left catDesc'>";
				if(isNew) {
				html += 		"<div class='newCatElem'>NEW</div>";
				} else {
				html += 		"<div class='newCatElem' style='visibility: hidden'>New</div>";
				}
				html += 		"<div>";
				html += 			"<h2>"+obj.nomeProdotto.replace(/_/g, " ").toUpperCase()+"</h2>";
				html += 		"</div>";
				html += 		"<div>";
				if(obj.sottotitolo!==undefined && obj.sottotitolo!="") {
				html += 			"<h3>"+obj.sottotitolo.toUpperCase()+"</h3>";
				} else {
				html += 			"<h3>&nbsp;</h3>";
				}
				html += 		"</div>";
				html += 		"<div>";
				html += 			"<div class='download customButton download' style='display: none' onclick='downloadCatalogo(&#39;"+obj.id+"&#39;)'>Download</div>";
				html += 			"<div class='read customButton' style='display: none' onclick='loadCatalogo(&#39;"+obj.id+"&#39;, 0);'>Read</div>";
				html += 			"<div class='deleteButton'><div style='display: none' onclick='deleteCatalogo(&#39;"+obj.id+"&#39;)'>Delete</div></div>";//loadIndexCatalogo(&#39;"+obj.id+"&#39;);
				html +=				"<div class='loading' style='display: none; width: 40px; height: 40px;'><div class='percDownload'>0%</div><img src='img/aggiorna_ico_new.png' /></div>";
				html += 		"</div>";
				html += 		"<div class='clear'></div>";
				html += 	"</div>";
				
				//scelgo in che linea inserire il catalogo
				if(obj.category.toLowerCase()==productSelected.toLowerCase()) {
					$("#catalogo-thumbs").append(html);
				} else if (obj.category.toLowerCase()=="common") {
					$("#catalogo-thumbs2").append(html);
				}
				
				//scelgo i bottoni visibili
				if(scaricato) {
					$("#el"+obj.id+" .download").hide();
					$("#el"+obj.id+" .read").show();
					$("#el"+obj.id+" .deleteButton div").show();
					$("#el"+obj.id+" .loading").hide();
				} else if (scaricando) {
					$("#el"+obj.id+" .download").hide();
					$("#el"+obj.id+" .read").hide();
					$("#el"+obj.id+" .deleteButton div").hide();
					$("#el"+obj.id+" .loading").show();
				} else {
                    console.log("disegno library");
					$("#el"+obj.id+" .download").show();
					$("#el"+obj.id+" .read").hide();
					$("#el"+obj.id+" .deleteButton div").hide();
					$("#el"+obj.id+" .loading").hide();
				}
			}
		});
		$("#catalogo-thumbs, #catalogo-thumbs2").append("<div class='clear'></div>");
		$("#catalogo-thumbs").width(($("#catalogo-thumbs .catalogoThumb").length*733));
		$("#catalogo-thumbs2").width(($("#catalogo-thumbs2 .catalogoThumb").length*733));
            
		if(pendingUrls>0) {
            //downloadLoop();
		}
    }
        var lineOneScroll = new IScroll('#catListContainer1', { eventPassthrough: true, scrollX: true, scrollY: false });
		var lineTwoScroll = new IScroll('#catListContainer2', { eventPassthrough: true, scrollX: true, scrollY: false });
        
        /*setTimeout(function() {
            $.each(libraryImages, function(idx, el) {
                var item = new Image();
                item.src=el;
                $("#"+idx+" .catPreview").append(item);
            });
        }, 1);*/
        
        libraryLoaded = true;
	});
	
	$("#preview-container .swipe-wrap").on("tap", function() {
		$("#prevTopBar").toggle();
	});
	
	$("#video").on("loadpanel", function() {
        if(!videoLoaded) {
		var video = storedData.video;
		var lineSelector = true;
		$("#video-thumbs").html("");
		$("#video-thumbs2").html("");
        try {
		$.each(video, function(idx, obj) {
			var scaricato =  false;
			var scaricando = false;
            var isNew = Math.ceil(Math.abs(new Date() - new Date(obj.time * 1000)) / (1000 * 3600 * 24)) < 30 ? true : false;
			if(typeof getLocalUrl(obj.url["0"]) != "undefined") {
				scaricato = true;
			} else {
				if(pendingDownload.contains(obj.id)) {
					scaricando = true;
				}
			}
			var html = "";
			html += "<li class='videoItem left'  id='el"+obj.id+"'>";
			html += 	"<div class='left'>";
			html += 		"<img src='"+getLocalUrl(obj.thumb)+"' width='612' height='340' />";
			html += 	"</div>";
			html += 	"<div class='desc left'>";
			if(isNew) {
			html += 		"<div class='newVidElem'>NEW</div>";
			} else {
			html += 		"<div class='newVidElem' style='visibility: hidden'>New</div>";
			}
			html += 		"<div class='title'>"+obj.nomeVideo.toUpperCase()+"</div>";
            if(obj.sottotitolo) {
                if(obj.sottotitolo.length<=13) {
                html += 		"<div class='valid'>"+obj.sottotitolo.toUpperCase()+"</div>";
                } else {
                html += 		"<div class='valid'>"+obj.sottotitolo.substring(0,13).toUpperCase()+"...</div>";
                }
            } else {
                html += 		"<div class='valid'>&nbsp;</div>";
            }
			html += 		"<div class='customButton download' style='display: none' onclick='downloadVideo(&#39;"+obj.id+"&#39;)'>Download</div>";
			html += 		"<div style='display: none' class='customButton read' onclick='loadVideo(&#39;"+obj.id+"&#39;)'>View</div>";
			html +=			"<div class='loading' style='display: none; width: 40px; height: 40px;'><div class='percDownload'>0%</div><img src='img/aggiorna_ico_new.png' /></div>";
			html += 		"<div class='deleteButton'><div style='display: none' onclick='deleteVideo(&#39;"+obj.id+"&#39;)'>Delete</div></div>";
			html += 	"</div>";
			html +=		"<div class='clear'></div>";
			html += "</li>";
			//scelgo in che linea inserire il catalogo
			if(obj.category.toLowerCase()=="video upper") {
				$("#video-thumbs").append(html);
			} else if (obj.category.toLowerCase()=="video lower") {
				$("#video-thumbs2").append(html);
			}
			
			//scelgo i bottoni visibili
			if(scaricato) {
				$("#el"+obj.id+" .download").hide();
				$("#el"+obj.id+" .read").show();
				$("#el"+obj.id+" .deleteButton div").show();
				$("#el"+obj.id+" .loading").hide();
			} else if (scaricando) {
				$("#el"+obj.id+" .download").hide();
				$("#el"+obj.id+" .read").hide();
				$("#el"+obj.id+" .deleteButton div").hide();
				$("#el"+obj.id+" .loading").show();
			} else {
                console.log("disegno library video")
				$("#el"+obj.id+" .download").show();
				$("#el"+obj.id+" .read").hide();
				$("#el"+obj.id+" .deleteButton div").hide();
				$("#el"+obj.id+" .loading").hide();
			}
		});
        } catch(e) {
            console.log(e);   
        }
		$("#video-thumbs, #video-thumbs2").append("<div class='clear'></div>");
		$("#video-thumbs").width(($("#video-thumbs .videoItem").length*892+40));
		$("#video-thumbs2").width(($("#video-thumbs2 .videoItem").length*892+40));
		
		if(pendingUrls>0) {
			//downloadLoop();
		}
        videoLoaded = true;
    }
        var lineOneVideoScroll = new IScroll('#videoListContainer1', { eventPassthrough: true, scrollX: true, scrollY: false });
		var lineTwoVideoScroll = new IScroll('#videoListContainer2', { eventPassthrough: true, scrollX: true, scrollY: false });
	});
	
	//var history = 0;
	$("#news").on("loadpanel", function() {
        //if(intel.xdk.device.model.indexOf("iPad1")!=-1) {
            $("#contentNews").append("<iframe></iframe>")
        //} else {
            MyPlugin.worker.startWork(messaggiStored.news.url,[550,0] );
            if(intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {//landscape
                MyPlugin.worker.ruotaOrizzontale();   
            } else {
                MyPlugin.worker.ruotaVerticale();
            }
        //}
        $(".menuButtonHome, .switcher").hide();
		$("#newsNavigator").show();
        //newsLoaded = true;
	});
	$("#news").on("unloadpanel", function() {
        //if(intel.xdk.device.model.indexOf("iPad1")==-1) {
            MyPlugin.worker.stopWork();
        //}
		$("#newsNavigator").hide();
        $(".menuButtonHome, .switcher").show();
	});
	
	$("#account").on("loadpanel", function() {
        if(isConnected) {
                updateMessageCall();
        }
        $("#contentMessage").delegate("a", "click", function(e) {
           e.preventDefault();
            var url = $(this).attr("href");
            intel.xdk.device.launchExternal(url);
        });
        try {
            var mess = JSON.parse(intel.xdk.cache.getCookie("messaggi"));
        } catch(e) {
            console.log("errore sul parse dei messaggi");
        }
		newsSuccess(intel.xdk.cache.getCookie("messaggi"));
		if(pendingUrls>0) {
			//downloadLoop();
		}
        messaggiLoaded = true;
	});
	
    //Chiamo il servizio di login
    $("#loginForm").submit(function(e) {
        e.preventDefault();
        var usr = $("#user").val();
		var psw = $("#password").val();
        if(typeof intel.xdk.cache.getCookie("userCached")!="undefined" && intel.xdk.cache.getCookie("userCached")!=usr && intel.xdk.cache.getCookie("userCached")!="") {
            intel.xdk.cache.clearAllCookies();
            intel.xdk.cache.clearMediaCache();
            $("#afui.ios7 .panel  #contentMessage").html("");
        }
		$("#loginForm .errorContainer").html("");
		intel.xdk.cache.setCookie("user",usr,-1);
		intel.xdk.cache.setCookie("userCached",usr,-1);
		intel.xdk.cache.setCookie("password",psw,-1);
		url = "http://molteni.monforte.it/output/check_version/"+usr+"/"+psw;
        previewLoaded = false;
        libraryLoaded = false;
        videoLoaded = false;
        newsLoaded = false;
        messaggiLoaded = false;
        $(".accountBadge").hide();
        updateMessageCall();
		if(isConnected) {
			$("#downloadLoading").show();
			intel.xdk.device.getRemoteData(url, "post", "", "loginSuccess", "loginError");
		}/* else if((intel.xdk.cache.getCookie("dataItems")!="" && typeof intel.xdk.cache.getCookie("dataItems") != "undefined")) {
			storedData = JSON.parse(intel.xdk.cache.getCookie("dataItems")); 
			$.ui.loadContent("#chooser");
		}*/ else {
			showLoginError("Unable to connect to server. Please check your connection");
		}
    });
});
function indexOpener() {
	$('#indexContainer').toggle(); 
    loadIndexCatalogo(currentCatalogo);
}
function showLoginError(message) {
	$("#loginForm .errorContainer").html(message);
}
function dummyFunction(data) {
    
}
function callUpdateMessages(){
    intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/check_version/"+intel.xdk.cache.getCookie("user")+"/"+intel.xdk.cache.getCookie("password"), "post", "", "dummyFunction", "dummyFunction");
    intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/messages", "GET", "", "updateMessages", "updateMessagesError");
}
function updateMessages(data) {
    if(messaggiStored!="" && typeof messaggiStored!="undefined") {
        var old;
        try {
            old = Object.size(messaggiStored);
        } catch(e) {
            old = 0;   
        }
        var young = old; 
        var dataJson;
        try {
            dataJson = JSON.parse(data);
            messaggiStored=dataJson;
            young = Object.size(dataJson); 
        } catch(e) {
            young = old;
        }
        if(young > old) {
            $(".accountBadge").show();
            //$("#accountIcon").append("<div class='accountBadge'></div>");
            $("#accountIcon .accountBadge").html(young - old);
            newsSuccess(data);
        }
    } else {
        newsSuccess(data);
    }
}
function updateMessagesError(data) {
    console.log(data);
}
var readMessages;
function newsSuccess(data) {
	var dataEl = data;
    if(intel.xdk.cache.getCookie("readMessages")!==undefined && intel.xdk.cache.getCookie("readMessages")!="") {
        readMessages = intel.xdk.cache.getCookie("readMessages").split("|");
    } else {
        readMessages = [];
    }
	try {
		var messaggi = JSON.parse(dataEl);
		intel.xdk.cache.setCookie("messaggi",dataEl,-1);
		messaggiStored = messaggi;
		$("#sideScroll").html("");
        var msgLoaded = 0;
		$.each(messaggi, function(idx, obj) {
            if(typeof obj.id!="undefined") {
                var classToAdd = "";
                var messaggiLngt = Object.size(messaggi)-2;
                if(msgLoaded==messaggiLngt){
                    loadMessage(obj.id);
                    classToAdd = "active";
                }
                msgLoaded++;
                var html = "";
                var readClass = "unread";
                if(readMessages.contains(obj.id)) {
                //if(jQuery.inArray(obj.id, readMessages)!=-1) {
                    readClass="read";
                }
                html += "<div class='sideElMessages "+ classToAdd +" " + readClass + "' onclick='loadMessage(&#39;"+obj.id+"&#39;);sideStyle(this);'>";
                if(typeof obj.title!="undefined") {
                    if(obj.title.length<=60) {
                        html +=  "<div class='tit'><span class='bull'>&bull;</span>"+obj.title+"</div>";
                    } else {
                        html +=  "<div class='tit'><span class='bull'>&bull;</span>"+obj.title.substring(0,60)+"...</div>";
                    }
                }
                
                html +=  "<div class='dat'>"+obj.creation_date+"</div>";
                html += "</div>";
                $("#sideScroll").prepend(html);
            }
		});
		$("#sideScroll").height($("#sidescroll .sideElMessages").height()*$("#sidescroll .sideElMessages").length);
        setTimeout(function() {
		  var scrollAccount = new IScroll('#sideMessage');
        }, 500);
	} catch(e) {
		console.log(e);
	}
}
function getLocalUrl(url) {
	try {
		if(typeof url != "undefined" && url!=null) {
			if(url.indexOf("dummy")==-1) {
				return intel.xdk.cache.getMediaCacheLocalURL(url);
			} else {
				return "img/dummy.png";
			}
		}
	} catch (e) {
		console.log(e);
	}
}
function newsError(data) {
	console.log(data);
}
var contentMessageScroll;
function loadMessage(id) {
    if(intel.xdk.cache.getCookie("readMessages")===undefined || intel.xdk.cache.getCookie("readMessages")=="") {
            var totMessaggi = Object.size(messaggiStored);
            if((totMessaggi-1) > 0) {
                $(".accountBadge").show();
                $(".accountBadge").html(totMessaggi-1);
            }
            intel.xdk.cache.setCookie("readMessages", id, -1);
    } else {
        var tmpArray = intel.xdk.cache.getCookie("readMessages").split("|");
        if((Object.size(messaggiStored) - Object.size(tmpArray) - 1 ) > 0) {
            $(".accountBadge").show();
            $(".accountBadge").html(Object.size(messaggiStored) - Object.size(tmpArray) - 1);
        } else {
            $(".accountBadge").hide();
        }
        if(!tmpArray.contains(id)) {
            var newCookie = intel.xdk.cache.getCookie("readMessages") + "|" + id;
            intel.xdk.cache.setCookie("readMessages", newCookie, -1);
        }
    }
	$("#contentMessage").html("");
	var html = "";
	html += "<div class='messageHeader'>"
	html += 	"<h2>"+messaggiStored[id].title+"</h2>"
	html += 	"<h3>"+messaggiStored[id].creation_date+"</h3>"
	html += "</div>"
	html += "<div class='messageContentEl' id='contenutoMessaggio'><div>";
    if(messaggiStored[id].image!="") {
        if(typeof getLocalUrl(messaggiStored[id].image)=="undefined"){
           pendingUrls.push(messaggiStored[id].image);
           html += "<img src='"+messaggiStored[id].image+"' class='left'>";
        } else {
           html += "<img src='"+getLocalUrl(messaggiStored[id].image)+"' class='left'>";
        }
    }
	html += atob(messaggiStored[id].description);
	html += "</div></div>";
	$("#contentMessage").append(html);
    /*$('#contenutoMessaggio div').height($('#contenutoMessaggio div').height());
    $('#contenutoMessaggio div').css("position", "absolute");
    setTimeout(function(){contentMessageScroll = new IScroll('#contenutoMessaggio')}, 500);*/
}
function loadVideo(id) {
	//$("#videoitem").html("");
	var video = storedData.video[id].url["0"];
    if(typeof getLocalUrl(video)!="undefined") {
	   intel.xdk.player.playPodcast(getLocalUrl(video));
    } else {
        $("#el"+id+" .loading .percDownload").text("0%");
        $("#el"+id).removeClass("isInDownload");
        $("#el"+id+" .loading img").removeClass("spin")
        $("#el"+id+" .read, #el"+id+" .loading, #el"+id+" .deleteButton").hide();
        $("#el"+id+" .download").show(); 
    }
	//$("#videoitem").append("<video width='100%' height='100%' controls><source src='"+getLocalUrl(video)+"' type='video/mp4'></source></video>")
	//$.ui.loadContent("#videoitem");
}
function loadPreviewItem(id) {
	var preview = storedData.preview;
	$("#prevTopBar .positioning").html("1");
	$("#preview-container .swipe-wrap").html("");
	var el = document.getElementById('preview-container')
	var elClone = el.cloneNode(true);
	el.parentNode.replaceChild(elClone, el);
	/*try {
		$("#previewItem .swipe-wrap").on("doubleTap", ".catPw", function(evt) {
			var jThis = $(this);
			$("#previewItem .enlargedSwipe").html("");
			var bg = jThis.css("background");
			$(document.createElement("div")).addClass("enlargedItem").css("background", bg).appendTo("#previewItem .enlargedSwipe");
			var distance = window.innerWidth/2;
			$("#previewItem .enlarge .enlargedSwipe").css("webkitTransform", "translate(-"+distance+"px, -"+distance+"px)");
			$("#previewItem .enlarge").show();
		});
	} catch(e) {
		console.log(e);
	}
    */
	var sizeEl = Object.size(preview[id].pages);
	
	try {
		for(var k = 0; k<sizeEl; k++) {	
                    $("#preview-container .swipe-wrap").append("<div class='slide' ><div class='catPw' style='background: url("+getLocalUrl(preview[id].pages[k])+") no-repeat center center'></div></div>");
		}	
	} catch(e) {
		console.log(e);
	}
	
	setTimeout(function() {
		try {
			window.previewSwipe = Swipe(document.getElementById('preview-container'), {
					transitionEnd: function(pos, elem) {
                        $("#pinch .slide").removeClass("isVisiblePw");
						if(pos>1 && sizeEl<3) {
							$("#prevTopBar .positioning").html(parseInt(pos)-1);
						} else {
							$("#prevTopBar .positioning").html(parseInt(pos)+1);
						}
                        $(elem).addClass("isVisiblePw");
					}
			});
            $("#preview-container .swipe-wrap .catPw").each(function() {
                addPinchToElement(document.getElementById("pinch"), this); 
            });
            $("#preview-container .swipe-wrap .slide").eq(0).addClass("isVisiblePw");
		} catch (e) {
			console.log(e);
		}
	},400);
	
	$("#prevTopBar .goToStart").on("click", function() {
		previewSwipe.slide(0);
	});
	$("#prevTopBar .goToEnd").on("click", function() {
		previewSwipe.slide($("#preview-container .swipe-wrap .slide").length - 1);
	});
    /*$("#previewItem .swipe-wrap").on("doubleTap", ".catPw", function() {
        $("#previewItem .pinch, #preview-container").hide();
        $(".pinch.pEl"+$("#previewItem .swipe-wrap .catPw").index($(this))).show();
    });
    $(".pinch").remove();*/
    //addPinchToElement(document.getElementById("pinch"), document.getElementById("pinch")); 
	$.ui.loadContent("#previewItem");
}
var hammerEventCB = function(event) {
    console.log(event);
}
var prevSlide = 1;
var pagina = 0;
var prevDirection = "null";
function regularize(rif, diff, curCatalogo) {
	var lgt = parseInt(Object.size(storedData.catalogs[curCatalogo].pages));
	var res = parseInt(rif) + parseInt(diff);
	if((lgt-res)<0) {
		return res-lgt;
	} else if(res<0) {
		return lgt+res;
	} else {
		return res;
	}
}
var orientPrev;
var currentIndex;
function loadIndexCatalogo(id) {
    try {
		currentIndex=JSON.parse(intel.xdk.cache.getCookie(storedData.catalogs[id].nomeProdotto.replace(/\./g, "-")));
	} catch(e) {
        currentIndex={};
		console.log("Errore parse indice di ricerca, ricerca non disponibile");
	}
}
function initThumbnails(id) {
    $("#thContainer, #sectionsContainer, #indexContainer").hide();
	$("#thContainer #thSwipe").html("");
	try{
	$.each(storedData.catalogs[id].thumbs, function(i, elem) {
		var numerello = parseInt(i);
		if (intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {
			if (i %2 == 1)  {
					numerello = numerello-1;
			}
		} else {
			numerello = numerello-1;
		}
		var htmlToAppend = "";
		htmlToAppend += "<div class='thumbDiv el"+i+"' style='float: left; margin: 10px 10px; width: 200px;'>";
		htmlToAppend += 	"<div class='thNumber'>";
		htmlToAppend += 		i!=0 ? i : "";
		htmlToAppend += 	"</div>";
		htmlToAppend += 	"<div>";
		htmlToAppend += 		"<img onclick='prevDirection=&#39;uncontrolled&#39;;loadCatalogo(&#39;"+id+"&#39;, &#39;"+numerello+"&#39;, &#39;null&#39;)' style='width: 200px !important;' src='"+getLocalUrl(elem)+"'' />";
		htmlToAppend += 	"</div>";
		htmlToAppend += "</div>";
        $("#thContainer #thSwipe").append(htmlToAppend);
	});
	$("#thContainer #thSwipe").append("<div class='clear'></div>");
	var thumbWidth = parseInt($("#thContainer #thSwipe img").eq(0).width());
	$("#thContainer #thSwipe").width((thumbWidth + 20)*Object.size(storedData.catalogs[id].thumbs));
	} catch(e) {
        console.log(e);
		//currentError=e; $.ui.loadContent("#error");
	}
	try {
		var precSection = "";
		document.getElementById("swipeTR").innerHTML="";
		$.each(storedData.catalogs[currentCatalogo].structure, function(z, valz) { //sezione
            if(typeof valz.sez!="undefined" && valz.sez!=precSection && valz.sez!="") {
                precSection = valz.sez;
                var tdEl = document.createElement("TD");
                tdEl.style.lineHeight="75px";
                var numerello2 = parseInt(valz.vai_a);
                if (intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {
                    if (numerello2 %2 != 1)  {
                            numerello2 = numerello2+1;
                    }
                }
                tdEl.onclick=function() {
                    $("#swipeTR td").css("color", "#929292");
                    this.style.color="#FFFFFF";
                    prevDirection='uncontrolled';
                    thumbScroll.scrollToElement("div:nth-child("+(parseInt(valz.vai_a)+1)+")", 100);
                    loadCatalogo(currentCatalogo, parseInt(numerello2)-1, 'null', true);
                }
                if(valz.sez.indexOf("toc")==-1 && valz.sez.indexOf("cover")==-1) {
                    tdEl.innerHTML=valz.sez.substring(valz.sez.indexOf("_")+1, valz.sez.length).toUpperCase();
                } else if(valz.sez.indexOf("toc")!=-1) {
                    tdEl.innerHTML="SUMMARY";
                } else if(valz.sez.indexOf("cover")!=-1) {
                    tdEl.innerHTML="COVER";
                }
                document.getElementById("swipeTR").appendChild(tdEl);
            }
		});
	} catch(e) {
		console.log(e)
	}
}
function initSearch() {
    
}
function initZoom() {
 $("#catalogo .swipe-wrap").on("doubleTap", ".catEl", function(evt) {
		var jThis = $(this);
		$("#catalogo .enlargedSwipe").html("");
		var bg = jThis.css("background");
		$(document.createElement("div")).addClass("enlargedItem").css("background", bg).appendTo("#catalogo .enlargedSwipe");
		if (intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {
			var num = parseInt(jThis.css("background").substring(jThis.css("background").indexOf("pagina")+6, jThis.css("background").indexOf(".png")));
			if (num %2 == 1)  {
				//siamo a destra
				var tmpBg = jThis.siblings(".catEl").eq(0).css("background");
				$(document.createElement("div")).addClass("enlargedItem").css("background", tmpBg).prependTo("#catalogo .enlargedSwipe");
				$("#catalogo .enlargedSwipe").append("<div class='clear'></div>");
			} else {
				//siamo a sinistra
				var tmpBg = jThis.siblings(".catEl").eq(0).css("background");
				$(document.createElement("div")).addClass("enlargedItem").css("background", tmpBg).appendTo("#catalogo .enlargedSwipe");
				$("#catalogo .enlargedSwipe").append("<div class='clear'></div>");
			}
		}
		var distance = window.innerWidth/2;
		$("#catalogo .enlarge .enlargedSwipe").css("webkitTransform", "translate(-"+distance+"px, -"+distance+"px)");
		$("#catalogo .enlarge").show();
	});   
}
function tapCatalogo() {
    $("#catTopBar").toggle();
        if(tTopTimer!=null) {
            clearTimeout(tTopTimer);
        }
            tTopTimer = setTimeout(function() {
                if($("#catTopBar").css("display")=="block" && $("#thContainer").css("display")!="block" && $("#indexContainer").css("display")!="block") {
                $("#catTopBar").hide();
                    }
            }, 3000);
		$('#thContainer, #sectionsContainer, #indexContainer').hide()
}
function loadCatalogo(id, pos, isUncontrolled, isFromNav) {
	if(orientPrev!=intel.xdk.device.orientation || $(".panel[selected='selected']").attr("id")!="catalogo" || isUncontrolled=="null") {
	var cataloghi = storedData.catalogs;
	orientPrev = intel.xdk.device.orientation;
	pagina = parseInt(pos);
	if(isUncontrolled=="uncontrolled") {
		if(prevDirection=="null") { //Se primo caricamento
			pagina=0;
		} else if(prevDirection=="uncontrolled") {
			if(intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {//landscape
				if(pagina == 2){
					pagina = regularize(pagina, -2, currentCatalogo) 
				} else {
					pagina = regularize(pagina, -1, currentCatalogo);
				}
			} else {
				if(pagina != 0){
					pagina = regularize(pagina, -1, currentCatalogo);
				}
			}
		} else if(prevDirection=="right") {
			if(intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {//landscape
				if(pagina %2 != 1) { //pari
					pagina = pagina;
				} else {
					pagina = regularize(pagina, -1, currentCatalogo);
				}
			} else {
				pagina = regularize(pagina, -3, currentCatalogo);
			}
		} else if(prevDirection=="left") {
			if(intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {//landscape
				if(pagina %2 != 1) { //pari
					pagina = pagina;
				} else {
					pagina = regularize(pagina, +1, currentCatalogo);
				}
			} else {
				pagina = regularize(pagina, 0, currentCatalogo);
			}
		}
		prevDirection="uncontrolled";
	}
	
	$("#catalogo .enlarge").hide()
	//clono e distruggo il vecchio slider per eliminare i bind
	var el = document.getElementById('catalogo-container'), elClone = el.cloneNode(true);
        if(typeof elClone!="undefined") {
	el.parentNode.replaceChild(elClone, el);
        }
	
	/*$("#catalogo-container .swipe-wrap").bind("tap", function() {
		$("#catTopBar").toggle();
        if(tTopTimer!=null) {
            clearTimeout(tTopTimer);
        }
        console.log($("#indexContainer").css("display"));
            tTopTimer = setTimeout(function() {
                if($("#catTopBar").css("display")=="block" && $("#thContainer").css("display")!="block" && $("#indexContainer").css("display")!="block") {
                $("#catTopBar").hide();
                    }
            }, 3000);
		$('#thContainer, #sectionsContainer, #indexContainer').hide()
	});  */
	
    $("#indexContainer .idxTitolo").html(cataloghi[id].nomeProdotto);
    $("#indexContainer #searchInput").val("");
    $("#indexContainer .idxRisultati").html("");
        
        
    currentCatalogo = id;
	prevSlide = 1;
	$("#catTopBar .positioning").html(pagina+1);
    $("#catalogo-container .swipe-wrap").html("");
    
    
	if (intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") { //landscape	
		if(pagina %2 == 1) { 
			pagina = regularize(pagina, -1, currentCatalogo);
		}
		var html = "";
		html += "<div class='slide' id='slide0' style='-webkit-transform: translate(-2048px, 0px) translateZ(0px); -webkit-transition: 0ms;'>";
        html += "<div class='slideSwipe'>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, -2, currentCatalogo)])+") no-repeat center center;'>";
		html += 	"</div>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, -1, currentCatalogo)])+") no-repeat center center'>";
		html += 	"</div>";
		html += "</div>";
		html += "</div>";
		html += "<div class='slide isVisibleCat' id='slide2' style='-webkit-transform: translate(0px, 0px) translateZ(0px); -webkit-transition: 0ms;'>";
        html += "<div class='slideSwipe'>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, 0, currentCatalogo)])+") no-repeat center center'>";
		html += 	"</div>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, 1, currentCatalogo)])+") no-repeat center center'>";
        html += "</div>";
		html += 	"</div>";
		html += "</div>";
		html += "<div class='slide' id='slide4' style='-webkit-transform: translate(2048px, 0px) translateZ(0px); -webkit-transition: 0ms;'>";
        html += "<div class='slideSwipe'>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, 2, currentCatalogo)])+") no-repeat center center'>";
		html += 	"</div>";
		html += 	"<div class='catEl left' style='background: url("+getLocalUrl(cataloghi[id].pages[regularize(pagina, 3, currentCatalogo)])+") no-repeat center center'>";
		html += 	"</div>";
		html += "</div>";
		html += "</div>";
		$("#catalogo-container .swipe-wrap").append(html);
		$("#catalogo-container .swipe-wrap .slide").eq(1).addClass("currentSlide");
		setTimeout(function() {
				window.catalogoSwipe = new Swipe(document.getElementById('catalogo-container'), {
					startSlide: 1,
					transitionEnd: function(index, elem) {
                        catScrollEnabled = false;
                        $("#pinch2 .slide").removeClass("isVisibleCat");
                        setTimeout(function() {
                            catScrollEnabled=true;
                        }, 500);
						if(index!=prevSlide) {
							if(index-prevSlide==+1 || index-prevSlide==-2) {
								if(prevDirection=="null") {
									pagina=regularize(pagina, +4, currentCatalogo);
								} else if(prevDirection=="right") {
									pagina= regularize(pagina, +2, currentCatalogo);
								} else if(prevDirection=="uncontrolled") {
									pagina=regularize(pagina, +4, currentCatalogo);
								} else {
									pagina= regularize(pagina, +5, currentCatalogo);
								}
								$("#catalogo .slide").eq((prevSlide+2)%3).find(".catEl").eq(0).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, 0, currentCatalogo)])+") no-repeat center center");
								$("#catalogo .slide").eq((prevSlide+2)%3).find(".catEl").eq(1).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, 1, currentCatalogo)])+") no-repeat center center");
								prevDirection="right";
								$("#catTopBar .positioning").html(regularize(pagina, 0, currentCatalogo)-1);
							} else {	
								if(prevDirection=="null") {
									pagina= regularize(pagina, -3, currentCatalogo);
								} else if (prevDirection=="left") {
									pagina=regularize(pagina, -2, currentCatalogo);
								} else if(prevDirection=="uncontrolled") {
									pagina= regularize(pagina, -3, currentCatalogo);
								} else {
									pagina=regularize(pagina, -5, currentCatalogo);
								}
								$("#catalogo .slide").eq((prevSlide-2)%3).find(".catEl").eq(1).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, 0, currentCatalogo)])+") no-repeat center center");
								$("#catalogo .slide").eq((prevSlide-2)%3).find(".catEl").eq(0).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, -1, currentCatalogo)])+") no-repeat center center");
								prevDirection="left";
								$("#catTopBar .positioning").html(regularize(pagina, 1, currentCatalogo)+1);
							}
							prevSlide=index;
						}
                        $(elem).addClass("isVisibleCat");
					}
				});
			},200);
	} else {
        var iter = 0;
		for(var i = pagina;i<pagina+3; i++) {
            if(iter==1){
                $("#catalogo-container .swipe-wrap").append("<div class='slide isVisibleCat'><div class='slideSwipe'><div class='catEl' style='background: url("+getLocalUrl(cataloghi[id].pages[i])+") no-repeat center center;'></div></div></div>");
            } else {
                $("#catalogo-container .swipe-wrap").append("<div class='slide'><div class='slideSwipe'><div class='catEl' style='background: url("+getLocalUrl(cataloghi[id].pages[i])+") no-repeat center center;'></div></div></div>");
            }
            iter++;
		}
		$("#catalogo-container .swipe-wrap .slide").eq(1).addClass("currentSlide");
		pagina = pagina+2;
		setTimeout(function() {
			window.catalogoSwipe = new Swipe(document.getElementById('catalogo-container'), {
				startSlide: 1,
				transitionEnd: function(index, elem) {
                     catScrollEnabled = false;
                    $("#pinch2 .slide").removeClass("isVisibleCat");
                    setTimeout(function() {
                        catScrollEnabled=true;
                    }, 500);
					if(index!=prevSlide) {
						if(index-prevSlide==+1 || index-prevSlide==-2) {
							if(prevDirection=="null") {
								pagina = regularize(pagina, 1, currentCatalogo)
							} else if(prevDirection=="right") {
								pagina = regularize(pagina, 1, currentCatalogo)
							} else if(prevDirection=="uncontrolled") {
								pagina = regularize(pagina, 1, currentCatalogo)
							} else {
								pagina = regularize(pagina, 3, currentCatalogo)
							}
							$("#catTopBar .positioning").html(regularize(pagina, -1, currentCatalogo));
							$(".slide").eq((prevSlide+2)%3).find(".catEl").eq(0).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, 0, currentCatalogo)])+") no-repeat left top");
							prevDirection="right";
						} else {
							if(prevDirection=="null") {
								pagina = regularize(pagina, -1, currentCatalogo)
							} else if(prevDirection=="left") {
								pagina = regularize(pagina, -1, currentCatalogo)
							} else if(prevDirection=="uncontrolled") {
								pagina = regularize(pagina, -1, currentCatalogo)
							} else {
								pagina = regularize(pagina, -3, currentCatalogo)
							}
							$("#catTopBar .positioning").html(regularize(pagina, 1, currentCatalogo));
							$(".slide").eq((prevSlide-2)%3).find(".catEl").eq(0).css("background", "url("+getLocalUrl(storedData.catalogs[currentCatalogo].pages[regularize(pagina, 0, currentCatalogo)])+") no-repeat left top");
							prevDirection="left";
							
						}
						prevSlide=index;
					}
                    $(elem).addClass("isVisibleCat");
				}
			});
		},200);
		$("#catTopBar .goToStart").on("click", function() {
			loadCatalogo(currentCatalogo, regularize(0, 0, currentCatalogo))
		});
		$("#catTopBar .goToEnd").on("click", function() {
			loadCatalogo(currentCatalogo, regularize(Object.size(currentCatalogo.pages)-2, 0, currentCatalogo));
		});
	}
    //initZoom();
    $("#catalogo .enlargedSwipe").html("");
    $("#catalogo-container .swipe-wrap .slideSwipe").each(function() {
        addPinchToElement(document.getElementById("pinch2"), this); 
    });
    if(isFromNav===undefined) {
	   initThumbnails(id)
    }
    setTimeout(function() {
        if($("#catTopBar").css("display")=="block" && $("#thContainer").css("display")!="block" && $("#indexContainer").css("display")!="block") {
            $("#catTopBar").hide();
        }
    }, 3000);
	$.ui.loadContent("#catalogo");
	}
}
//Cambio categoria 
function catChooser(product){
	productSelected=product;
	pageProductLoad();
}
function goPreview(product) {
	catChooser(product);
	$.ui.loadContent("#preview");
	$("#previewIcon").addClass("pressed");
}
//Ricarico a seconda della categoria
function pageProductLoad() {
	if (productSelected == "molteni") {
		$("#afui.ios7 #header .logoHeader img").attr("src", "img/Molteni-h.png");
		$("#afui.ios7 #header .switcher img").attr("src", "img/D.png");
	} else {
		$("#afui.ios7 #header .logoHeader img").attr("src", "img/Dada-h.png");
		$("#afui.ios7 #header .switcher img").attr("src", "img/M.png");
	}
	var titolo = $(".panel[selected='selected']").attr("title"); 
	if(titolo=="Login" || titolo=="Chooser" || titolo=="Catalogo" || titolo=="PreviewItem" || titolo=="Video Item" ) {
		$("#header, #navbar").hide();
	}
}
function switchCat() {
    previewLoaded = false;
    libraryLoaded = false;
    newsLoaded = false;
    messaggiLoaded = false;
	if (productSelected == "molteni") {
		productSelected="dada";
		//console.log($(".panel[selected='selected']").attr("id"));
		//$.ui.updatePanel("#"+$(".panel[selected='selected']").attr("id"));
		var sel = "#"+$(".panel[selected='selected']").attr("id");
		//$.ui.loadContent("#dummy",false,false,"fade");
		//$.ui.loadContent(sel,false,false,"fade");
        $(sel).trigger("loadpanel");
	} else {
		//console.log("dada");
		productSelected="molteni";
		var sel = "#"+$(".panel[selected='selected']").attr("id");
		//$.ui.loadContent("#dummy",false,false,"fade");
		//$.ui.loadContent(sel,false,false,"fade");
        $(sel).trigger("loadpanel");
		//$.ui.updatePanel("#"+$(".panel[selected='selected']").attr("id"));
	}
}
//Eseguo il login
function loginSuccess(data) {
    console.log(data);
    console.log("login success");
	var user;
	try {
		user = JSON.parse(data);
        console.log(user);
	} catch(e) {
		user = {
			return_code: "KO"
		}
        console.log("no user");
	}
    if(user.return_code=="OK") {
		intel.xdk.cache.setCookie("logged","true",-1);
		intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/sitemap", "GET", "", "getData", "getDataError");
    } else {
		$("#downloadLoading").hide();
		showLoginError("No active account for those username and password<br>Nessun account attivo per questo user e questa password");
	}
}
function autoLogin() {
	intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/sitemap", "GET", "", "getData", "getDataError");
}
function loginError(data) {
    $("#downloadLoading").hide();
}
var timerEntrata;
function getData(data, reload) {
	try {
		storedData = JSON.parse(data);
	} catch(e) {
        if(typeof intel.xdk.cache.getCookie("dataItems") != "undefined") {
            storedData =  JSON.parse(intel.xdk.cache.getCookie("dataItems"));
        }
        $.ui.loadContent("#chooser");
            return;
	}
	var oldStoredData = "";
        if(typeof intel.xdk.cache.getCookie("dataItems") != "undefined") {
            oldStoredData = JSON.parse(intel.xdk.cache.getCookie("dataItems"));
            intel.xdk.cache.setCookie("dataItems",data,-1);
            //Verifico elementi da rimuovere (preview)
            $.each(oldStoredData.preview, function(i, obj) {
                if(typeof obj.thumb != "undefined") {
                    if(typeof storedData.preview[obj.id]!="undefined" && storedData.preview[obj.id].thumb!=obj.thumb) { //Controllo thumb
                        intel.xdk.cache.removeFromMediaCache(getLocalUrl(obj.thumb));
                    }
                }
                $.each(obj.pages, function(k, intObj) {	//Controllo immagini interne
                    if(typeof storedData.preview[obj.id]!="undefined" && storedData.preview[obj.id].pages[k]!=intObj) {
                        intel.xdk.cache.removeFromMediaCache(getLocalUrl(intObj));
                    }
                });
            });
            //Verifico elementi da rimuovere (catalogo)
            $.each(oldStoredData.catalogs, function(i, obj) {
                if(typeof obj.thumb != "undefined") {
                    if(typeof storedData.catalogs[obj.id]!="undefined" && storedData.catalogs[obj.id].thumb!=obj.thumb) { //Controllo thumb
                        intel.xdk.cache.removeFromMediaCache(getLocalUrl(obj.thumb));
                    }
                }
                $.each(obj.pages, function(k, intObj) {	//Controllo immagini interne
                    if(typeof storedData.catalogs[obj.id]!="undefined" && storedData.catalogs[obj.id].pages[k]!=intObj) {
                        intel.xdk.cache.removeFromMediaCache(getLocalUrl(intObj));
                    }
                });
            });
            //Verifico elementi da rimuovere (video)
            $.each(oldStoredData.video, function(i, obj) {
                if(typeof storedData.video[obj.id]!="undefined" && storedData.video[obj.id].thumb!=obj.thumb) { //Controllo thumb
                    intel.xdk.cache.removeFromMediaCache(getLocalUrl(obj.thumb));
                }
            });
        } else {
            intel.xdk.cache.setCookie("dataItems",data,-1);
        }
        if(Object.size(storedData.catalogs)>0 || Object.size(storedData.video)>0 || Object.size(storedData.preview)>0) {
            //Verifico elementi da aggiungere (preview)
            $.each(storedData.preview, function(i, obj) { //Controllo thumb
                if(typeof getLocalUrl(obj.thumb)=="undefined") {
                    pendingUrls.push("loginDownload_"+obj.thumb);
                }
                $.each(obj.pages, function(k, intObj) {	//Controllo immagini interne
                    if(typeof getLocalUrl(intObj)=="undefined") {
                        pendingUrls.push("loginDownload_"+intObj);
                    }
                });
            });
            //Verifico elementi da aggiungere (catalogo)
            $.each(storedData.catalogs, function(i, obj) { //Controllo thumb
                if(typeof getLocalUrl(obj.preview_cover)=="undefined" && obj.preview_cover!="") {
                    pendingUrls.push("loginDownload_"+obj.preview_cover);
                }
                if(typeof getLocalUrl(obj.pages[1])=="undefined") {
                    pendingUrls.push("loginDownload_"+obj.pages[1]);
                }
            });
            //Verifico elementi da aggiungere (video)
            $.each(storedData.video, function(i, obj) { //Controllo thumb
                if(typeof getLocalUrl(obj.thumb)=="undefined") {
                    pendingUrls.push("loginDownload_"+obj.thumb);
                }
            });
        totLogin = pendingUrls.length;
        intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/messages", "post", "", "newsSuccess", "newsError");
        if(pendingUrls.length>0) {
            downloadLoop();
        }
        timerEntrata = setInterval(function() {
            if(pendingUrls.length==0) {
                $("#downloadLoading .percDownload").text(0+"%");
                clearInterval(timerEntrata);
                if(typeof reload!="undefined") {
                    var sel = "#"+$(".panel[selected='selected']").attr("id");
                    //$.ui.loadContent("#dummy", true, true, "fade");
                    //$.ui.loadContent(sel, true, true, "fade");
                    $(sel).trigger("loadpanel")
                } else {
                    console.log(2);
                    $.ui.loadContent("#chooser");
                }
            }
        }, 500);
        } else {
            intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/messages", "post", "", "newsSuccess", "newsError");
            $.ui.loadContent("#chooser");
        }
}
var orientationLock = false;
function orientationListener() { 
	if(!orientationLock) {
		orientationLock = true;
		if($(".panel[selected='selected']").attr("id")=="catalogo") {
			loadCatalogo(currentCatalogo, pagina, "uncontrolled");
			//loadCatalogo(currentCatalogo, pagina);
		} else if($(".panel[selected='selected']").attr("id")=="news"){
            if(intel.xdk.device.orientation == "90" || intel.xdk.device.orientation == "-90") {//landscape
                MyPlugin.worker.ruotaOrizzontale();   
            } else {
                MyPlugin.worker.ruotaVerticale();
            }
        }
		setTimeout(function() {
			orientationLock = false;
		}, 500);
	}
}
function updateMessageCall() {
    callUpdateMessages();
}
document.addEventListener("intel.xdk.device.connection.update",function(){
	if(intel.xdk.device.connection != "none") {
		isConnected=true;    
	} else {
		isConnected=false;
	}
} ,false);

function downloadVideo(id) {
    try {
    var video = storedData.video[id].url["0"];
    if(typeof getLocalUrl(video)=="undefined") {
        $("#el"+id+" .loading .percDownload").text("0%");
        $("#el"+id).addClass("isInDownload");
        $("#el"+id+" .download").hide();
        $("#el"+id+" .loading").show();
        //$("#el"+id+" .loading img").addClass("spin");
        pendingDownload.push(id);
        if(video!="" && typeof video != "undefined") {
            pendingUrls.push(id+"_"+video);
            if(pendingUrls.length==1) {
                downloadLoop();
            }
        }
    }
	//downloadLoop();
    } catch(e) {
        console.log(e);
    }
}
function downloadVideoResume(id) {
    try {
    var video = storedData.video[id].url["0"];
    if(typeof getLocalUrl(video)=="undefined") {
        $("#el"+id).addClass("isInDownload");
        $("#el"+id+" .download").hide();
        $("#el"+id+" .loading").show();
        //$("#el"+id+" .loading img").addClass("spin");
        pendingDownload.push(id);
        if(video!="" && typeof video != "undefined") {
            pendingUrls.push(id+"_"+video);
            if(pendingUrls.length==1) {
                downloadLoop();
            }
        }
    }
	//downloadLoop();
    } catch(e) {
        console.log(e);
    }
}
var pendingUrls = [];
function downloadCatalogo(id) {
    if(isConnected) {
        if(typeof getLocalUrl(storedData.catalogs[id].pages[Object.size(storedData.catalogs[id].pages)-2]) == "undefined") {
        pendingDownload.push(id);
        cataloghiPercDownload[id] = 0;
        $("#el"+id).addClass("isInDownload");
        $("#el"+id+" .download, #el"+id+" .loading").toggle();
        //$("#el"+id+" .loading img").addClass("spin");
        var pagine = storedData.catalogs[id].pages;
        var thumbs = storedData.catalogs[id].thumbs;
        /*DOWNLOAD INDICI RICERCA*/
        var parameters = new intel.xdk.Device.RemoteDataParameters();
        parameters.url = "http://molteni.monforte.it/temp/contents/"+storedData.catalogs[id].nomeProdotto.replace(/ /g, "_").replace(/\//g, "-").replace(/°/g, "o").replace(/#/g, "_")+".html";
        parameters.id = id;
        parameters.method = 'GET';
        intel.xdk.device.getRemoteDataExt(parameters);
        /*FINE DOWNLOAD INDICI RICERCA*/
        for(el in pagine) {
            if(pagine[el]!="" && typeof pagine[el] != "undefined" ) {
                pendingUrls.push(id+"_"+pagine[el]);
                if(pendingUrls.length<2) {
                    downloadLoop();
                    console.log("in coda!")
                }
            }
        }
        for(el in thumbs) {
            if(thumbs[el]!="" && typeof thumbs[el] != "undefined" ) {
                pendingUrls.push(id+"_"+thumbs[el]);
                /*if(pendingUrls.length<3) {
                    downloadLoop();
                }*/
            }
        }
        }
    } else {
        $.ui.showMask("Unable to connect to server. Please check your connection"); 
        setTimeout(function() {
            $.ui.hideMask();
        }, 2500);
    }
}
document.addEventListener("intel.xdk.device.remote.data",getRemoteDataEvent,false);
function getRemoteDataEvent(event) {
	var data = event.response;
	data = data.replace(/\n/g,"");
	data = data.replace(/\r/g,"");
	data = data.replace(/\t/g,"");
	data = data.replace(/\f/g,"");
    console.log(JSON.parse(data));
    console.log(storedData.catalogs[event.id].nomeProdotto);
	intel.xdk.cache.setCookie(storedData.catalogs[event.id].nomeProdotto.replace(/\./g, "-"),data,-1);
}
function downloadAllCatalogs() {
    if(isConnected) {
        $("#afui.ios7 #menuDiDestra .contenuto ul li.catdwn div img").attr("src", "img/aggiorna_ico_new.png").addClass("spin");
        setTimeout(function() {
            $("#afui.ios7 #menuDiDestra .contenuto ul li.catdwn div img").attr("src", "img/dowloadContents.png").removeClass("spin");
        }, 2000);
        for(el in storedData.catalogs) {
            downloadCatalogo(storedData.catalogs[el].id);
        }
    } else {
        $.ui.showMask("Unable to connect to server. Please check your connection");   
        setTimeout(function() {
            $.ui.hideMask();
        }, 2500);
        console.log("downlod all connection")
        $(".isInDownload").find(".download").show();
        $(".isInDownload").find(".deleteButton").hide();
        $(".isInDownload").find(".read").hide();
        $(".isInDownload").find(".loading").hide();
    }
}
function downloadAllVideos() {
    if(isConnected) {
        $("#afui.ios7 #menuDiDestra .contenuto ul li.viddwn div img").attr("src", "img/aggiorna_ico_new.png").addClass("spin");
        setTimeout(function() { 
            $("#afui.ios7 #menuDiDestra .contenuto ul li.viddwn div img").attr("src", "img/dowloadContents.png").removeClass("spin");
        }, 2000);
        for(el in storedData.video) {
            var vid = storedData.video[el];
            downloadVideo(vid.id);
        }
    } else {
        $.ui.showMask("Unable to connect to server. Please check your connection"); 
        setTimeout(function() {
            $.ui.hideMask();
        }, 2500);
        console.log("download all videos connection");
        $(".isInDownload").find(".download").show();
        $(".isInDownload").find(".deleteButton").hide();
        $(".isInDownload").find(".read").hide();
        $(".isInDownload").find(".loading").hide();
    }
}
function deleteVideo(id) {
	$("#el"+id+" .deleteButton").addClass("css3-blink");
	pendingRemove.push(id);
	var video = storedData.video[id].url["0"];
	if(typeof video != "undefined") {
		intel.xdk.cache.removeFromMediaCache(video);
	}
    $("#el"+id+" .loading .percDownload").text("0%");
    /*$("#el"+id+" .download").show();
    $("#el"+id+" .deleteButton").removeClass("css3-blink");
    $("#el"+id+" .read, #el"+id+" .deleteButton").hide();*/
}
function deleteCatalogo(id) {
	$("#el"+id+" .deleteButton").addClass("css3-blink");
	var pagine = storedData.catalogs[id].pages;
    pendingRemove.push(id);
	for(el in pagine) {
		if(pagine[el]!="" && typeof getLocalUrl(pagine[el]) != "undefined" && pagine[el].indexOf("http://")!=-1) {
            console.log("intel.xdk.cache.removeFromMediaCache("+pagine[el]+")");
			intel.xdk.cache.removeFromMediaCache(pagine[el]);
		}
	}
    //pendingRemove.splice(el, 1);
    /*$("#el"+id+" .download").show();
     $("#el"+id+" .deleteButton").removeClass("css3-blink");
    $("#el"+id+" .read, #el"+id+" .deleteButton").hide();*/
}
function cacheUpdated(evt) {
    var url = evt.id.replace("transaction", "");
    var vidId;
    $.each(storedData.video, function(idx, obj) {
        if(obj.url[0] == url) {
            vidId = obj.id;
            return false;
        }
    });
    if(!$("#el"+vidId+" .loading img").hasClass("spin") && parseInt(evt.current/evt.total*100)>0){
        $("#el"+vidId+" .loading img").addClass("spin");
    }
    if(parseInt(evt.current/evt.total*100)>parseInt($("#el"+vidId+" .loading .percDownload").text().replace("%", ""))) {
        $("#el"+vidId+" .loading .percDownload").text(parseInt(evt.current/evt.total*100)+"%");
        if(pendingDownload.contains(vidId)) {
            pendingDownload.splice(vidId, 1);
        }
    }
}
function cacheRemoved(evt) {
    try {
        var videos = storedData.video;
        var cataloghi = storedData.catalogs;
        if(pendingRemove.length > 0) {
            for(el in pendingRemove) {
                var id = pendingRemove[el];
                var catalogo = cataloghi[id];
                var video = videos[id];
                if(typeof videos[id]!="undefined") {
                    pendingRemove.splice(el, 1);
                    $("#el"+id+" .loading .percDownload").text("0%");
                    console.log("cache removed");
                    $("#el"+id+" .download").show();
                    $("#el"+id+" .deleteButton").removeClass("css3-blink");
                    $("#el"+id+" .read, #el"+id+" .deleteButton").hide();
                } else if(typeof cataloghi[id]!="undefined") {
                    var pagine = catalogo.pages;
                    var numeroPagine = Object.size(pagine);
                    var ultimaPagina = catalogo.pages[numeroPagine-2];
                    if(typeof getLocalUrl(ultimaPagina)=="undefined") {
                        pendingRemove.splice(el, 1);
                        $("#el"+id+" .download").show();
                        $("#el"+id+" .deleteButton").removeClass("css3-blink");
                        $("#el"+id+" .read, #el"+id+" .deleteButton").hide();
                    }
                }
            }
        }
    } catch(e) {
        console.log(e);
    }
}
function downloadLoop() {
    if(isConnected) {
        if(pendingUrls[0]!=null && typeof pendingUrls[0]!="undefined" && pendingUrls[0].indexOf("dummy")==-1) {
            if(typeof getLocalUrl(pendingUrls[0])=="undefined") {
                var url = pendingUrls[0].substring(pendingUrls[0].indexOf("http://"), pendingUrls[0].length);
                intel.xdk.cache.addToMediaCacheExt(url,"transaction"+url);
            } else {
                pendingUrls.splice(0, 1);      
                downloadLoop()
            }
        } else {
            cacheComplete();
        }
    } else {
        $.ui.showMask("Unable to connect to server. Please check your connection");
        setTimeout(function() {
            $.ui.hideMask();
        }, 2500);
        pendingUrls = [];
        console.log("downloadLoop connection");
        $(".isInDownload").find(".download").show();
        $(".isInDownload").find(".deleteButton").hide();
        $(".isInDownload").find(".read").hide();
        $(".isInDownload").find(".loading").hide();
    }
}
/*function resetDownload(id) {
    $("#el"+id+" .download").show();
    $("#el"+id+" .read, #el"+id+" .deleteButton").hide();
}*/
var cataloghiPercDownload = {}
function controllaPercentuale(id) {
    var scaricati = parseInt(cataloghiPercDownload[id])+1;
    var catalogoLength = Object.size(storedData.catalogs[id].pages);
    var percentage = parseInt((scaricati/(catalogoLength*2-4))*100);
    cataloghiPercDownload[id] = scaricati;
    $("#el"+id+" .loading .percDownload").text(percentage+"%");
    if(percentage>0 && !$("#el"+id+" .loading img").hasClass("spin")){
        $("#el"+id+" .loading img").addClass("spin")
    }
    if(percentage>98) {
        $("#el"+id).removeClass("isInDownload");
        $("#el"+id+" .loading img").removeClass("spin")
        $("#el"+id+" .loading .percDownload").text("");
        $("#el"+id+" .download, #el"+id+" .loading").hide();
        $("#el"+id+" .read, #el"+id+" .deleteButton, #el"+id+" .read, #el"+id+" .deleteButton div").show();  
    }
}
var loghinDownloaded = 0;
var totLogin;
function controllaPercLogin() {
    loghinDownloaded++;
    var percentuale = parseInt(loghinDownloaded/totLogin*100);
    if(percentuale>0 && !isNaN(percentuale)) {
        $("#downloadLoading .percDownload").text(percentuale+"%");
        if(percentuale>99) {
            $("#downloadLoading .percDownload").text(" ");
            totLogin = 0;
        }
    }
}
var looper = 0;
function cacheComplete(data) {
        var pos = 0
        if(typeof pendingUrls[0]!="undefined" && pendingUrls[0]!=null) {
            pos = pendingUrls[0].indexOf("http://")-1;
        }
        if(pos>0) {
            var elementId = pendingUrls[0].substring(0, pos);
            if(typeof storedData.catalogs[elementId]!="undefined") {
                controllaPercentuale(elementId);
            } else if(elementId=="loginDownload") {
                controllaPercLogin();
            } else {
                console.log("completo")
                if(typeof getLocalUrl(storedData.video[pendingUrls[0].substring(0, pos)].url["0"])!="undefined" && getLocalUrl(storedData.video[pendingUrls[0].substring(0, pos)].url["0"])!=null) { //controllo che sia presente
                    $("#el"+elementId).removeClass("isInDownload");
                    $("#el"+elementId+" .loading img").removeClass("spin")
                    $("#el"+elementId+" .download, #el"+elementId+" .loading").hide();
                    $("#el"+elementId+" .read, #el"+elementId+" .deleteButton, #el"+elementId+" .read, #el"+elementId+" .deleteButton div").show();  
                } else { //sul resume
                    downloadVideoResume(elementId);
                    //downloadLoop();
                    //alert(getLocalUrl(storedData.video[pendingUrls[0].substring(0, pos)].url["0"]))
                    /*console.log("cache complete");
                    $("#el"+elementId).removeClass("isInDownload");
                    $("#el"+elementId+" .loading img").removeClass("spin")
                    $("#el"+elementId+" .read, #el"+elementId+" .loading, #el"+elementId+" .deleteButton").hide();
                    $("#el"+elementId+" .download").show(); */
                }
            }
        }
        pendingUrls.splice(0, 1);
        if(pendingUrls.length>0) {
            downloadLoop();
        }
}
function getThumbs(obj) {
	var panel = obj.closest(".panel");
	var slides = panel.find(".catEl");
	var thumbCont = panel.find(".catThumbContainer");
	if($(".catThumbContainer")[0].innerHTML=="") {
		slides.each(function() {
			$(this).clone().appendTo(thumbCont);
		});
	}
}
function openMenu() {
	$("#menuDiDestra").css3Animate({
		x: "-100%",
		time: "500ms"
	});
	$("#overlay").show();
}
function closeMenu() {
	$("#menuDiDestra").css3Animate({
		x: "+100%",
		time: "500ms"
	});
	$("#overlay").hide();
}
function logout() {
	if(isConnected) {
		intel.xdk.cache.setCookie("logged","false",-1);
		intel.xdk.device.getRemoteData("http://molteni.monforte.it/login/logout", "post", "", "logoutSuccess", "logoutError");
	} else {
        $.ui.showMask("Unable to connect to server. Please check your connection");   
        /*
        modifica 20140221 Elisabetta
		closeMenu();
        $("#login .container").show();
        setTimeout(function() {
		  $.ui.loadContent("#login");
        }, 1000);
        */
	}
}
function logoutSuccess(data) {
    $("#login .container").show();
	closeMenu();
        setTimeout(function() {
	$.ui.loadContent("#login");
        }, 1000);
}
function logoutError(data) {
	console.log(data);
}
function goLibrary() {
	$("#navEl").toggle();
	$.ui.loadContent("#library",false,false,"slide");
}
function goBackPreview() {
	$("#navEl").toggle();
	$.ui.loadContent("#preview",false,false,"slide");
}
function clearVideo() {
	$("#videoItem").html("");
}
function updateJsonData() {
    if(isConnected) {
    previewLoaded = false;
    libraryLoaded = false;
    videoLoaded = false;
    newsLoaded = false;
    messaggiLoaded = false;
	$("#afui.ios7 #menuDiDestra .contenuto ul li.update div img").attr("src", "img/aggiorna_ico_new.png").addClass("spin");
	intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/check_version/"+intel.xdk.cache.getCookie("user")+"/"+intel.xdk.cache.getCookie("password"), "post", "", "internalAuth", "internalAuthError");
	intel.xdk.cache.removeCookie("dataItem");
	intel.xdk.cache.removeCookie("messaggi");
    } else {
        $.ui.showMask("Unable to connect to server. Please check your connection");   
        setTimeout(function() {
            $.ui.hideMask();
        }, 2500);
    }
}
function internalAuth(data) {
	var user = JSON.parse(data);
    if(user.return_code=="OK") {
		intel.xdk.device.getRemoteData("http://molteni.monforte.it/output/sitemap", "GET", "", "updateData", "updateDataError");
	} else {
		console.log("login errato");
	}
}
function internalAuthError(data) {
	console.log(data);
}
function updateData(data) {
	if(isConnected) {
		try {
		intel.xdk.cache.setCookie("dataItems",data,-1);
		getData(data, true);
		} catch(e) {
			console.log(e);
		}
	}
	$("#afui.ios7 #menuDiDestra .contenuto ul li.update div img").attr("src", "img/Update.png").removeClass("spin");
}
function updateDataError(data) {
	console.log(data);
}
var ricordaOpened = false;
function showRicorda() {
	if(ricordaOpened) {
		$("#ricordaPassword, #ricordaPassword .compressed").css3Animate({
			height: "0px",
			time: "500ms"
		});
	} else {
		$("#ricordaPassword, #ricordaPassword .compressed").css3Animate({
			height: "160px",
			time: "500ms"
		});
	}
}
function videoBack() {
	alert("func");
}
function moveThumbs(pag) {
	console.log("inside");
	
}
function initThScroll() {
    var realHeight = 1;
    var realWidth = 1;
    var srcUrl = $("#thContainer #thSwipe img").eq(1).attr("src");
    var immaginina = new Image();
    immaginina.onload=function() {
        realHeight = this.height;   
        realWidth = this.width;
        var rapporto = realHeight/realWidth;
        if(rapporto>1) {
            $("#thContainer").height(360);
        } else {
            $("#thContainer").height(225);
        }
    }
    immaginina.src=srcUrl;
	//if(!thumbScrolling) {
	thumbScroll = new IScroll('#thContainer', { eventPassthrough: true, scrollX: true, scrollY: false });
	thumbScrolling = true;
	//}
}
function catGoNext() {
    if(catScrollEnabled) {
        catScrollEnabled=false;
        catalogoSwipe.next();
    }
}
function hideLogo(){
    if((intel.xdk.device.orientation==-90 || intel.xdk.device.orientation==90) && (isRetina || parseInt(intel.xdk.device.osversion.substring(0,1))>6 )) {
        console.log("no ipad 1");
        $("#logoHome").hide();
    }
}
function catGoPrev() {
    if(catScrollEnabled) {
        catScrollEnabled=false;
        catalogoSwipe.prev();
    }
}
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
var prevTransform = "";
var posX=0, posY=0;
function addPinchToElement(el, subEl) {
	if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
		Hammer.plugins.fakeMultitouch();
	}
    
     var hammertime = Hammer(el, {
        transform_always_block: true,
        transform_min_scale: 1,
        drag_block_horizontal: true,
        drag_block_vertical: true,
        drag_min_distance: 30
    });

    var rect = subEl;

    var scale=1, last_scale, last_posx = 0, last_posy = 0;

      hammertime.on('touch drag transform doubletap', function(ev) {
        if($(rect.parentNode).hasClass("isVisiblePw") || $(rect.parentNode).hasClass("isVisibleCat")) {
            switch(ev.type) {
                /*case 'tap':
                    if($(rect.parentNode).hasClass("isVisibleCat")) {
                        tapCatalogo();
                    }
                    break;*/
                case 'doubletap':
                    if(scale<2) {
                        var img1 = $(".isVisibleCat .catEl").eq(0).css("backgroundImage").substring($(".isVisibleCat .catEl").eq(0).css("backgroundImage").indexOf("http://"), $(".isVisibleCat .catEl").eq(0).css("backgroundImage").length-1);
                        var img2 = $(".isVisibleCat .catEl").eq(1).css("backgroundImage").substring($(".isVisibleCat .catEl").eq(1).css("backgroundImage").indexOf("http://"), $(".isVisibleCat .catEl").eq(1).css("backgroundImage").length-1);
                        $("#catalogo .enlarge").html("<div class='left'><img style='zoom: 1' src='"+img1+"' /></div><div class='left'><img style='zoom: 1;' src='"+img2+"' /></div><div class='clear'></div>");
                        $("#catalogo .enlarge").show()
                    } else {
                        $("#catalogo .enlarge").hide()
                    }
                    break;
                case 'touch':
                    if($(rect.parentNode).hasClass("isVisibleCat")) {
                        tapCatalogo();
                    }
                    last_scale = scale;
                    last_posx = posX;
                    last_posy = posY;
                    break;
    
                case 'drag':
                    if(last_scale>1) {
                        posX = (ev.gesture.deltaX + last_posx);
                        if(Math.abs(posX) > (parseInt($(window).width())/2)) {
                            posX = posX<0 ? -parseInt($(window).width())/2 : parseInt($(window).width())/2;
                        } 
                        posY = (ev.gesture.deltaY + last_posy);
                        if(Math.abs(posY) > (parseInt($(window).height())/2)) {
                            posY = posY<0 ? -parseInt($(window).height())/2 : parseInt($(window).height())/2;
                        }
                    }
                    break;
    
                case 'transform':
                    scale = Math.max(1, Math.min(last_scale * ev.gesture.scale, 10));
                    if(scale>2) {
                        scale = 2;
                    }
                    break;
                
            }
            if(scale>1) {
                if($(rect.parentNode).hasClass("isVisibleCat")) {
                    window.catalogoSwipe.disableSwipe();
                } else {
                    window.previewSwipe.disableSwipe();
                }
            } else {
                posX=0;
                posY=0;
                if($(rect.parentNode).hasClass("isVisibleCat")) {
                    window.catalogoSwipe.enableSwipe();
                } else {
                    window.previewSwipe.enableSwipe();
                }
            }
            
            if(scale>1) {
                
            } else {
                
            }
            // transform!
            /*var transform;
            transform = "translate3d("+(posX*last_scale)+"px,"+(posY*last_scale)+"px, 0) " + "scale3d("+scale+", "+scale+", 0) ";
            rect.style.webkitTransform = transform;*/
            /*rect.style.zoom=scale;*/
      }
    });
}
function importCss(url) {
     var element = document.createElement('link');
     element.href = url;
     element.rel = 'stylesheet';
     element.type = 'text/css';
     document.body.appendChild(element);
}
document.addEventListener("intel.xdk.device.resume",function(e){
    $.ui.hideMask();
    setTimeout(function() {
        console.log("resuming...")
        $(".isInDownload").find(".download").hide();
        $(".isInDownload").find(".deleteButton").hide();
        $(".isInDownload").find(".read").hide();
        $(".isInDownload").find(".loading").show();
    }, 1000);
},false);
//document.addEventListener("intel.xdk.player.podcast.error", videoError, false);
document.addEventListener("intel.xdk.cache.media.update", cacheUpdated, false);
document.addEventListener("intel.xdk.cache.media.add", cacheComplete, false);
document.addEventListener("intel.xdk.cache.media.remove", cacheRemoved, false);