/**
 KMRS MOBILE
 Version 1.0
 */
/**
 Default variable declarations
 */
var ajax_url = krms_config.ApiUrl;
var ajax_url_append = krms_config.append_api;
var dialog_title_default = krms_config.DialogDefaultTitle;
var search_address;
var ajax_request;
var cart = [];
var networkState;
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    setTimeout(function () {
        navigator.splashscreen.hide();
    }, 3000);

    if (isLogin()) {
        console.log("login ok");
        $(".logout-menu").show();
        $(".login-menu").hide();
    } else {
        console.log("not looged in ");
        $(".logout-menu").hide();
        $(".login-menu").show();
    }

    if (!empty(krms_config.pushNotificationSenderid)) {
        var push = PushNotification.init({
            "android": {
                "senderID": krms_config.pushNotificationSenderid
            },
            "ios": {
                "alert": "true",
                "badge": "true",
                "sound": "true"
            },
            "windows": {}
        });
        push.on('registration', function (data) {
            setStorage("device_id", data.registrationId);
            var params = "registrationId=" + data.registrationId;
            params += "&device_platform=" + device.platform;
            params += "&client_token=" + getStorage("client_token");
            callAjax("registerMobile", params);
        });
        push.on('notification', function (data) {
            //alert(JSON.stringify(data));
            if (data.additionalData.foreground) {
                if (data.additionalData.additionalData.push_type == "order") {
                    showNotification(data.title, data.message);
                } else {
                    showNotificationCampaign(data.title, data.message);
                }
            } else {
                if (data.additionalData.additionalData.push_type == "order") {
                    showNotification(data.title, data.message);
                } else {
                    showNotificationCampaign(data.title, data.message);
                }
            }
            push.finish(function () {
                //alert('finish successfully called');
            });
        });
        push.on('error', function (e) {
            //onsenAlert("push error");
        });
    }
}
jQuery.fn.exists = function () {
    return this.length > 0;
}

function dump(data) {
    console.debug(data);
}

function setStorage(key, value) {
    localStorage.setItem(key, value);
}

function getStorage(key) {
    return localStorage.getItem(key);
}

function removeStorage(key) {
    localStorage.removeItem(key);
}

function explode(sep, string) {
    var res = string.split(sep);
    return res;
}

function urlencode(data) {
    return encodeURIComponent(data);
}
$(document).on("keyup", ".numeric_only", function () {
    if ($(this).hasClass('range1_5')) {
        if (this.value.length > 1) {
            var ch = this.value;
            this.value = ch.charAt(0);
        }
        this.value = this.value.replace(/[^1-5\-().]/g, '');

    } else {
        this.value = this.value.replace(/[^0-9\-().]/g, '');
    }
});



$(document).on({
    'DOMNodeInserted': function () {
        $('.pac-item, .pac-item span', this).addClass('needsclick');
    }
}, '.pac-container');

ons.bootstrap();
ons.ready(function () {
    dump('ready');
    refreshConnection();
    setTimeout('getLanguageSettings()', 1100);
}); /*end ready*/
function refreshConnection() {
    if (!hasConnection()) {
        $(".home-page").hide();
        $(".no-connection").show();
    } else {
        $(".home-page").show();
        $(".no-connection").hide();
    }
}

function hasConnection() {
    return true;
    networkState = navigator.network.connection.type;
    if (networkState == "Connection.NONE" || networkState == "none") {
        return false;
    }
    return true;
}

function createElement(elementId, elementvalue) {
    var content = document.getElementById(elementId);
    content.innerHTML = elementvalue;
    ons.compile(content);
}

ons.ready(function () {
    /*kNavigator.on('prepush', function(event) {
     dump("prepush");
     });*/
});
document.addEventListener("pageinit", function (e) {
    dump("pageinit");
    dump("pagname => " + e.target.id);
    appdata.pagename = e.target.id;
    switch (e.target.id) {
        case "page_events":
            if (getStorage("user_id") == null) {
                menu.setMainPage('prelogin.html', {
                    closeMenu: true
                });
                return false;
            }
            callAjax("events", "user_id=" + getStorage("user_id"));
            break;
		
        case "page_event_detail":
            if (getStorage("user_id") == null) {
                menu.setMainPage('prelogin.html', {
                    closeMenu: true
                });
                return false;
            }
			var params="user_id=" + getStorage("event_id")+'&event_id='+getStorage("event_id");
            callAjax("event_detail", params);
            break;	
			
        case "page_myschedule":
            if (getStorage("user_id") == null) {
                menu.setMainPage('prelogin.html', {
                    closeMenu: true
                });
                return false;
            }
            callAjax("myschedule", "user_id=" + getStorage("user_id"));
            break;
      
        case "page-profile":
            callAjax('getProfile',
                    "user_id=" + getStorage("user_id")
                    );
            translatePage();
            translateValidationForm();
            $(".first_name").attr("placeholder", getTrans('First Name', 'user_fname'));
            $(".last_name").attr("placeholder", getTrans('Last Name', 'user_lname'));
            $(".email_address").attr("placeholder", getTrans("Email Address", 'user_email'));
            break;
			
        case "page-login":
        case "page-prelogin":
            translatePage();
            translateValidationForm();
            $(".email_address").attr("placeholder", getTrans('Email address', 'email_address'));
            $(".password").attr("placeholder", getTrans('Password', 'password'));
            break;
        case "page-languageoptions":
            callAjax('getLanguageSelection', '');
            break;
        default:
            break;
    }
}, false);

function onsenAlert(message, dialog_title) {
    if (typeof dialog_title === "undefined" || dialog_title == null || dialog_title == "") {
        dialog_title = dialog_title_default;
    }
    dump(dialog_title);
    ons.notification.alert({
        message: message,
        title: dialog_title
    });
}

function hideAllModal() {
    setTimeout('loaderSearch.hide()', 1);
    setTimeout('loader.hide()', 1);
    setTimeout('loaderLang.hide()', 1);
}



function taskDetails(data) {
	
    if (data.task_status == '0') {
        data.task_status = 'DONE';
    }
	 createElement('task_title', data.title);
	 $('#task_id_add_comment').val(data.id);
    var html = '';
    html += '<ons-list>';
    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label"><b>Title</b> : ' + data.title + '';
    html += '</ons-if>';
    html += '</ons-list-item>';

    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label">';
    html += '<b>Priority</b> : ' + data.pname + '';
    html += '</ons-if>';
    html += '</ons-list-item>';

    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label">';
    html += '<b>Start date</b> : ' + data.task_startdate + '';
    html += '</ons-if>';
    html += '</ons-list-item>';

    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label">';
    html += '<b>End date</b> : ' + data.task_enddate + '';
    html += '</ons-if>';
    html += '</ons-list-item>';
    
    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label">';
    html += '<b>Status</b> : ' + data.task_status + '';
    html += '</ons-if>';
    html += '</ons-list-item>';

    html += '<ons-list-item modifier="nodivider">';
    html += '<ons-if platform="ios other" class="left left-label">';
    html += '<b>Description</b>: ' + data.task_desc + '';
    html += '</ons-if>';
    html += '</ons-list-item>';
    html += '</ons-list>';
    createElement('task_details', html);
   
		var comment_html='';
	if(data.arr_comment.length>0){	
	 $.each(data.arr_comment, function (key, val) {
		 
		var user_profilepic = '';
		if (val.user_profilepic != '') {
			user_profilepic = krms_config.ServerUrl + 'images/profile_image/' + val.user_profilepic;
		}
	 	comment_html+='<ons-list-item class="timeline-li" modifier="tappable" >';
		comment_html+='<ons-row>';
		comment_html+='  <ons-col width="50px">';
		comment_html+='	<img ng-src="'+user_profilepic+'" class="timeline-image">';
		comment_html+='  </ons-col>';

		comment_html+='  <ons-col>';
		comment_html+='	<div class="timeline-date">'+val.taskcomment_createdate+'</div>';
		comment_html+='	<div class="timline-from">';
		comment_html+='	  <span class="timeline-name">'+val.name+'</span>';
		comment_html+='	</div>';

		comment_html+='	<div class="timeline-message">';
		comment_html+='	'+val.taskcomment_desc+'';
		comment_html+='	</div>';
		comment_html+='  </ons-col>';
		comment_html+='</ons-row>';
	    comment_html+='</ons-list-item>';
	 });
	}else{
		 comment_html+='<ons-list-item class="timeline-li" modifier="tappable" ><ons-row><ons-col>No comments</ons-col></ons-row></ons-list-item>';
	}
	 createElement('task_comments', comment_html);
}

function openTaskDetail(id) {
    callAjax("task_details", "t_id=" + id + "&user_id=" + getStorage("user_id"));
    menu.setMainPage('task_detail.html');
}


function displayEventDetail(data) {
    var htm = '';
	//console.log(data.e_name);
	//background-image: url(http://callabhi.com/eventmanage/admin/upload/coverimg/4GV2fuiGKWvLyBR.jpg);
	 var logo = '';
	if (data.e_cover_image != '') {
		logo = krms_config.ServerUrl + '/admin/upload/coverimg/' + data.e_cover_image;
	}
	if(logo==''){
		$('#event_main_container').addClass('bgcardcolor');
		} else{
		$('#event_main_container').css("background-image", "url("+logo+")");  
	}
	$('#event_main_title').html(data.e_name);
	$('#event_main_location').html(data.e_location);
	
	var html_date_info=data.string_date;;
	$('#eventDetailHead').html(html_date_info);
	
	  var html = '';
	  
        $.each(data.users.result, function (key, val) {
			html +=' <ons-list-item modifier="tappable"  >';
			html +='<ons-row>';
			html +='<ons-col class="left" width="75%">';
			html +='<div class="sale_name">'+val.u_fullname+' ('+val.u_position+')</div>';
			html +='<div class="sale_date">'+val.u_company+'</div>';
			html +='<div class="sale_date">'+val.country+'</div>';
			html +='</ons-col>';
			html +='<ons-col class="right" width="25%"  style="padding-top:5px;">';
			html +=' <ons-button modifier="small" class="right" onclick="arrangeMeeting('+data.e_id+','+val.ea_id+','+val.u_id+','+getStorage("user_id")+')" >Arrange</ons-button>';
			html +='</ons-col>';
			html +='</ons-row>';
			html +='</ons-list-item><hr>';
		});
		
		 createElement('event_user_list', html);
	//data.e_name;
}


function setmenu(obj) {
    var obj = $(obj);
    obj.attr('onclick', 'setmenuback(this)');
    obj.next().hide();
}

function setmenuback(obj) {
    var obj = $(obj);
    obj.attr('onclick', 'setmenu(this)');
    obj.next().show();
}

function displayMySchedule(data){
	console.log(data);
	html='<hr>';
		//if (data.length > 0) {
        $.each(data, function (key, val) {
			var eventName=val.e_name;
			console.log(eventName);
			//html +='<ons-list-header> '+eventName+' </ons-list-header>';
			 html += '<ons-list-item modifier="tappable" id="' + val.e_id + '" class="row my-tab" data-onclick="" onclick="setmenu(this);">' + eventName + '</ons-list-item>';
			//if(val.data.length>0){
				html += '<ons-list class="restaurant-list listExtra my-row-bdr-nn-outer">';
				$.each(val.data, function (key1, val1) {
					var date=key1;
					
					html +='<ons-list-header> '+date+' </ons-list-header>';
					$.each(val1, function (key2, val2) {
						html +='<ons-list-item modifier="tappable"  >';
						html +='<ons-row>';
						html +='<ons-col class="left" width="50%">';
						html +='<div class="sale_name">'+val2.u_fullname+' ('+val2.u_position+')</div>';
						html +='<div class="sale_date">'+val2.u_company+'</div>';
						html +='<div class="sale_date">'+val2.country+'</div>';
						html +='</ons-col>';
						html +='<ons-col width="25%">';
						html +='<div class="sale_date">'+val2.eb_start_time+' '+val2.eb_end_time+'</div>';
						html +='</ons-col>';
						html +='<ons-col class="right" width="25%" style="padding-top:5px;">';
						html +=' <ons-button modifier="small" class="right" onclick="releaseMeeting('+val2.eb_id+')" >Release</ons-button>';
						html +='</ons-col>';
						html +='</ons-row>';
						html +='</ons-list-item><hr>';
					})	
					
				})
				html += '</ons-list><hr>';
		//	}
		});
		//}
		 createElement('schedule-list', html);
}

function displayAllEvents(data) {
    var htm = '';

    if (data.length > 0) {
        $.each(data, function (key, val) {
            var logo = krms_config.ServerUrl + 'box-demo/assets/img/logo.png';
            if (val.e_cover_image != '') {
                logo = krms_config.ServerUrl + '/admin/upload/coverimg/' + val.e_cover_image;
            }
            var address = "";
           
            htm += '<ons-list-item modifier="chevron" class="list-item-container" onclick="showEvent(' + val.e_id + ');">';
            htm += '<ons-row>';
            htm += '<ons-col width="95px">';
            htm += ' <img src="' + logo + '" class="thumbnail">';
            htm += ' </ons-col>';
            htm += ' <ons-col>';
            htm += '   <div class="name">';
            htm += val.e_name;
            htm += '    </div>';
            htm += '   <div class="location">';
            htm += '       ' + val.e_start_date+' - '+ val.e_end_date;
            htm += '    </div>';
            htm += '    <div class="desc">';
            htm += '     <i class="fa fa-map-marker"></i> ' + val.e_location;
            htm += '    </div>';
            htm += '  </ons-col>';
            htm += '   <ons-col width="40px"></ons-col>';
            htm += '  </ons-row>';
            htm += ' </ons-list-item>';
        });
    }
    htm += '';
    createElement('event-list', htm);
}


/*mycallajax*/
function callAjax(action, params) {
    if (!hasConnection()) {
        if (action != "registerMobile") {
            onsenAlert(getTrans("CONNECTION LOST", 'connection_lost'));
        }
        return;
    }
    /*add language use parameters*/
    params += "&lang_id=" + getStorage("default_lang");
    dump(ajax_url +  action +'&' + params);
    ajax_request = $.ajax({
        url: ajax_url +  action ,
        data: params,
        type: 'POST',
        async: false,
        dataType: 'jsonp',
        timeout: 6000,
        crossDomain: true,
        beforeSend: function () {
            if (ajax_request != null) {
                /*abort ajax*/
                hideAllModal();
                ajax_request.abort();
            } else {
                /*show modal*/
                switch (action) {
                    case "registerMobile":
                        break;
                    case "getLanguageSettings":
                        loaderLang.show();
                        break;
                    default:
                        loader.show();
                        break;
                }
            }
        },
        complete: function (data) {
            ajax_request = null;
            hideAllModal();
        },
        success: function (data) {

            appdata.response = data;
            dump(data);
            if (data.code == 0) {
                switch (action) {
                    case "signup":
                        setStorage("client_token", data.details.token); // register token
                        if (data.details.next_step == "shipping_address") {
                            var options = {
                                animation: 'slide',
                                onTransitionEnd: function () {
                                    displayMerchantLogo2(getStorage("merchant_logo"),
                                            getStorage("order_total"),
                                            'page-shipping');
                                }
                            };
                            sNavigator.pushPage("shipping.html", options);
                        } else if (data.details.next_step == "return_home") {
                            onsenAlert(data.msg);
                            menu.setMainPage('home.html', {
                                closeMenu: true
                            });
                        } else {
                            dump('payment_option');
                            var options = {
                                animation: 'slide',
                                onTransitionEnd: function () {
                                    displayMerchantLogo2(
                                            getStorage("merchant_logo"),
                                            getStorage("order_total"),
                                            'page-paymentoption'
                                            );
                                    var params = "merchant_id=" + getStorage("merchant_id");
                                    //callAjax("getPaymentOptions",params);
                                    callAjax("clienttoken", params);
                                }
                            };
                            sNavigator.pushPage("paymentOption.html", options);
                        }
                        break;

                    case "getProfile":
                        $(".first_name").val(data.details.user_fname);
                        $(".last_name").val(data.details.user_lname);
                        $(".email_profile").val(data.details.user_email);
                        appdata.userInfo = data.details;
                        break;
					
                    case "registerUsingFb":
                        break;

                    case "events":
                        displayAllEvents(data.details);
                        break;
					case "myschedule":
                        displayMySchedule(data.details);
                        break;
					
                    case "event_detail":
                        displayEventDetail(data.details);
                        break;	
					
                   
                    case "arrangeMeeting":
						//showEvent(getStorage('event_id'));
						 onsenAlert("Metting arrage successfully.");
                        break;	
						
                   
                    case "releaseMeeting":
					 	 onsenAlert("Metting released successfully.");
						 callAjax("myschedule", "user_id=" + getStorage("user_id"));
                        break;	
						
                    case "login":
                        //onsenAlert(data.msg);

                        setStorage("client_token", data.details.u_id);
                        setStorage("user_id", data.details.u_id);
                        setStorage("f_name", data.details.u_fullname);
                        setStorage("f_name", data.details.user_lname);
                        setStorage("full_name", data.details.u_fullname);
                        menu.setMainPage('events.html', {
                            closeMenu: true
                        });
                        break;
                    case "forgotPassword":
                        onsenAlert(data.msg);
                        dialogForgotPass.hide();
                        break;
                    case "registerMobile":
                        /*silent */
                        break;

                    case "getLanguageSelection":
                        displayLanguageSelection(data.details);
                        break;
                    case "getLanguageSettings":
                        setStorage("translation", JSON.stringify(data.details.translation));
                        var device_set_lang = getStorage("default_lang");
                        dump("device_set_lang=>" + device_set_lang);
                        if (empty(device_set_lang)) {
                            dump('proceed');
                            if (!empty(data.details.settings.default_lang)) {
                                setStorage("default_lang", data.details.settings.default_lang);
                            } else {
                                setStorage("default_lang", "");
                            }
                        }
                        translatePage();
                        break;
                    default:
                        //onsenAlert("Sorry but something went wrong during processing your request");
                        onsenAlert(data.msg);
                        break;
                }
            } else {
                /*failed condition*/
                switch (action) {

                    case "getProfile":
                        dump('show login form')
                        menu.setMainPage('prelogin.html', {
                            closeMenu: true
                        });
                        break;
                    case "registerMobile":
                    case "getSettings":
                    case "getLanguageSettings":
                        /*silent */
                        break;
                    default:
                        onsenAlert(data.msg);
                        break;
                }
            }
        },
        error: function (request, error) {
            hideAllModal();
            if (action == "getLanguageSettings" || action == "registerMobile") {
            } else {
                onsenAlert(getTrans("Network error has occurred please try again!", 'network_error'));
            }
        }
    });
}

function setHome() {
    dump("setHome");
    var options = {
        closeMenu: true,
        animation: 'slide',
        callback: setHomeCallback
    };
    menu.setMainPage('home.html', options);
}

function setHomeCallback() {
    refreshConnection();
}


function empty(data) {
    if (typeof data === "undefined" || data == null || data == "") {
        return true;
    }
    return false;
}
jQuery(document).ready(function () {

}); /*end ready*/

/*sliding menu*/
ons.ready(function () {
    console.log("On ready stage");

    menu.on('preopen', function () {
        console.log("Menu page is going to open");

        translatePage();
    });
});

function showProfile() {
    if (isLogin()) {
        menu.setMainPage('profile.html', {
            closeMenu: true
        });
    } else {
        menu.setMainPage('prelogin.html', {
            closeMenu: true
        })
    }
}


function showEvent(event_id) {
    appdata.event_id = event_id;
    setStorage("event_id", event_id);
    dump(event_id);
    var options = {
        animation: 'slide',
        onTransitionEnd: function () {
        }
    };
    sNavigator.pushPage("event_detail.html", options);
}


function saveProfile() {
    $.validate({
        form: '#frm-profile',
        borderColorOnError: "#FF0000",
        onError: function () {
        },
        onSuccess: function () {
            var params = $("#frm-profile").serialize();
            params += "&client_token=" + getStorage("client_token");
            callAjax("saveProfile", params);
            return false;
        }
    });
}

function arrangeMeeting(event_id,event_assign_id,event_partner_id,user_id) {
     var params =  "&user_id=" + getStorage("user_id")+"&ea_event_id=" + event_id+"&event_assign_id=" + event_assign_id+"&eb_partner_id=" + event_partner_id+"&eb_u_id=" +user_id;
     callAjax("arrangeMeeting", params);
     return false;
}


function releaseMeeting(eb_id) {
     var params =  "&user_id=" + getStorage("user_id")+"&eb_id=" + eb_id;
     callAjax("releaseMeeting", params);
     return false;
}
function changepassword() {
    $.validate({
        form: '#frm-changepassword',
        borderColorOnError: "#FF0000",
        onError: function () {
        },
        onSuccess: function () {
            var params = $("#frm-changepassword").serialize();
            params += "&client_token=" + getStorage("client_token");
            callAjax("changepassword", params);
            return false;
        }
    });
}
function login() {
    $.validate({
        form: '#frm-login',
        borderColorOnError: "#FF0000",
        onError: function () {
        },
        onSuccess: function () {
            var params = $("#frm-login").serialize();
            params += "&device_id=" + getStorage("device_id");
            callAjax("login", params);
            return false;
        }
    });
}


function logout() {
    removeStorage("client_token");
    removeStorage("user_id");
    onsenAlert(getTrans("Your are now logout", 'you_are_now_logout'));
    menu.setMainPage('prelogin.html', {
        closeMenu: true
    });
}

function isLogin() {
    if (!empty(getStorage("client_token"))) {
        return true;
    }
    return false;
}

function showLogin(next_steps) {
    var options = {
        animation: 'slide',
        onTransitionEnd: function () {
            if (!empty(next_steps)) {
                $(".page-login-fb").show();
                $(".next_steps").val(getStorage("transaction_type"));
            } else {
                $(".page-login-fb").hide();
                $(".next_steps").val('');
            }
        }
    };
    sNavigator.pushPage("login.html", options);
}

function showForgotPass() {
    $(".email_address").val('');
    if (typeof dialogForgotPass === "undefined" || dialogForgotPass == null || dialogForgotPass == "") {
        ons.createDialog('forgotPassword.html').then(function (dialog) {
            dialog.show();
            translatePage();
            translateValidationForm();
            $(".email_address").attr("placeholder", getTrans('Email Address', 'email_address'));
        });
    } else {
        dialogForgotPass.show();
    }
}

function forgotPassword() {
    $.validate({
        form: '#frm-forgotpass',
        borderColorOnError: "#FF0000",
        onError: function () {
        },
        onSuccess: function () {
            var params = $("#frm-forgotpass").serialize();
            callAjax("forgotPassword", params);
            return false;
        }
    });
}

function showMySchedule() {
    if (isLogin()) {
        menu.setMainPage('myschedule.html', {
            closeMenu: true
        });
    } else {
        menu.setMainPage('prelogin.html', {
            closeMenu: true
        });
    }
}

function showCalander() {
    if (isLogin()) {
        menu.setMainPage('calanders.html', {
            closeMenu: true
        });
    } else {
        menu.setMainPage('prelogin.html', {
            closeMenu: true
        });
    }
}

function signup() {
    $.validate({
        form: '#frm-signup',
        borderColorOnError: "#FF0000",
        onError: function () {
        },
        onSuccess: function () {
            var params = $("#frm-signup").serialize();
            params += "&device_id=" + getStorage("device_id");
            callAjax("signup", params);
            return false;
        }
    });
}


function initFacebook() {
    dump('initFacebook');
    if (!empty(krms_config.facebookAppId)) {
        $(".fb-loginbutton").show();
        openFB.init({
            appId: krms_config.facebookAppId
        });
    } else {
        $(".fb-loginbutton").hide();
    }
    /*$.ajaxSetup({ cache: true });
     $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
     FB.init({
     appId: '191654534503876',
     version: 'v2.3' // or v2.0, v2.1, v2.2, v2.3
     });
     });*/
}

function myFacebookLogin() {
    /*FB.getLoginStatus(function(response) {
     if (response.status === 'connected') {
     dump('already login');
     getFbInfo();
     } else {
     FB.login(function(response){
     dump(response);
     if ( response.status=="connected"){
     getFbInfo();
     } else {
     onsenAlert("Login failed.");
     }
     }, {scope: 'public_profile,email'});
     }
     });	*/
    openFB.login(
            function (response) {
                if (response.status === 'connected') {
                    //alert('Facebook login succeeded, got access token: ' + response.authResponse.token);
                    getFbInfo();
                } else {
                    alert('Facebook login failed: ' + response.error);
                }
            }, {
        scope: 'public_profile,email'
    });
}

function getFbInfo() {
    openFB.api({
        path: '/me',
        params: {
            fields: "email,first_name,last_name"
        },
        success: function (data) {
            dump(data);
            var params = "&email=" + data.email;
            params += "&first_name=" + data.first_name;
            params += "&last_name=" + data.last_name;
            params += "&fbid=" + data.id;
            params += "&device_id=" + getStorage("device_id");
            if ($(".next_steps").exists()) {
                params += "&next_steps=" + $(".next_steps").val();
            }
            callAjax("registerUsingFb", params);
        },
        error: fbErrorHandler
    });
    /*FB.api('/me?fields=email,name', function(response) {
     dump(response);
     var params="&email="+ response.email;
     params+="&name="+response.name;
     params+="&fbid="+response.id;
     if ( $(".next_steps").exists()){
     params+="&next_steps="+ $(".next_steps").val();
     }
     callAjax("registerUsingFb",params);
     });*/
}

function fbErrorHandler(error) {
    alert("ERROR=> " + error.message);
}

function FBlogout() {
    /*FB.logout(function(response) {
     dump(response);
     });*/
    openFB.logout(
            function () {
                onsenAlert('Logout successful');
            },
            fbErrorHandler);
}

function showNotification(title, message) {
    if (typeof pushDialog === "undefined" || pushDialog == null || pushDialog == "") {
        ons.createDialog('pushNotification.html').then(function (dialog) {
            $(".push-title").html(title);
            $(".push-message").html(message);
            dialog.show();
        });
    } else {
        $(".push-title").html(title);
        $(".push-message").html(message);
        pushDialog.show();
    }
}

function saveSettings() {
    setStorage("country_code_set", $(".country_code_set").val());
    var params = $("#frm-settings").serialize();
    params += "&client_token=" + getStorage("client_token");
    params += "&device_id=" + getStorage("device_id");
    callAjax("saveSettings", params);
}

function showNotificationCampaign(title, message) {
    if (typeof pushcampaignDialog === "undefined" || pushcampaignDialog == null || pushcampaignDialog == "") {
        ons.createDialog('pushNotificationCampaign.html').then(function (dialog) {
            $("#page-notificationcampaign .push-title").html(title);
            $("#page-notificationcampaign .push-message").html(message);
            dialog.show();
        });
    } else {
        $("#page-notificationcampaign .push-title").html(title);
        $("#page-notificationcampaign .push-message").html(message);
        pushcampaignDialog.show();
    }
}

function number_format(number, decimals, dec_point, thousands_sep) {
    number = (number + '')
            .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
            prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
            sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
            dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + (Math.round(n * k) / k)
                        .toFixed(prec);
            };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
            .split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
            .length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1)
                .join('0');
    }
    return s.join(dec);
}
var translator;
var dictionary;

function getLanguageSettings() {
    if (!hasConnection()) {
        return;
    }
    // callAjax("getLanguageSettings", '');
}

function translatePage() {
    dump("TranslatePage");

    if (isLogin()) {
        console.log("login ok");
        $(".logout-menu").show();
        $(".login-menu").hide();
    } else {
        console.log("not looged in ");
        $(".logout-menu").hide();
        $(".login-menu").show();
    }

    //if (getStorage("translation")!="undefined"){
    if (typeof getStorage("translation") === "undefined" || getStorage("translation") == null || getStorage("translation") == "") {
        return;
    } else {
        dictionary = JSON.parse(getStorage("translation"));
    }
    if (!empty(dictionary)) {
        //dump(dictionary);
        var default_lang = getStorage("default_lang");
        //dump(default_lang);
        if (default_lang != "undefined" && default_lang != "") {
            dump("INIT TRANSLATE");
            translator = $('body').translate({
                lang: default_lang,
                t: dictionary
            });
        }
    }
    appdata.ontranslationComplete();
}

function getTrans(words, words_key) {
    var temp_dictionary = '';
    /*dump(words);
     dump(words_key);	*/
    if (getStorage("translation") != "undefined") {
        temp_dictionary = JSON.parse(getStorage("translation"));
    }
    if (!empty(temp_dictionary)) {
        //dump(temp_dictionary);
        var default_lang = getStorage("default_lang");
        //dump(default_lang);
        if (default_lang != "undefined" && default_lang != "") {
            //dump("OK");
            if (array_key_exists(words_key, temp_dictionary)) {
                //dump('found=>' + words_key +"=>"+ temp_dictionary[words_key][default_lang]);
                return temp_dictionary[words_key][default_lang];
            }
        }
    }
    return words;
}

function array_key_exists(key, search) {
    if (!search || (search.constructor !== Array && search.constructor !== Object)) {
        return false;
    }
    return key in search;
}

function translateValidationForm() {
    $.each($(".has_validation"), function () {
        var validation_type = $(this).data("validation");
        switch (validation_type) {
            case "number":
                $(this).attr("data-validation-error-msg", getTrans("The input value was not a correct number", 'validation_numeric'));
                break;
            case "required":
                $(this).attr("data-validation-error-msg", getTrans("this field is mandatory!", 'validaton_mandatory'));
                break;
            case "email":
                $(this).attr("data-validation-error-msg", getTrans("You have not given a correct e-mail address!", 'validation_email'));
                break;
        }
    });
}

function showLanguageList() {
    if (typeof languageOptions === "undefined" || languageOptions == null || languageOptions == "") {
        ons.createDialog('languageOptions.html').then(function (dialog) {
            dialog.show();
            translatePage();
        });
    } else {
        languageOptions.show();
    }
}

function displayLanguageSelection(data) {
    var selected = getStorage("default_lang");
    dump("selected=>" + selected);
    var htm = '';
    htm += '<ons-list>';
    htm += '<ons-list-header class="list-header trn" data-trn-key="language">Language</ons-list-header>';
    $.each(data, function (key, val) {
        dump(val.lang_id);
        ischecked = '';
        if (val.lang_id == selected) {
            ischecked = 'checked="checked"';
        }
        htm += '<ons-list-item modifier="tappable" onclick="setLanguage(' + "'" + val.lang_id + "'" + ');">';
        htm += '<label class="radio-button checkbox--list-item">';
        htm += '<input type="radio" name="country_code" class="country_code" value="' + val.lang_id + '" ' + ischecked + ' >';
        htm += '<div class="radio-button__checkmark checkbox--list-item__checkmark"></div>';
        htm += ' ' + val.language_code;
        htm += '</label>';
        htm += '</ons-list-item>';
    });
    htm += '</ons-list>';
    createElement('language-options-list', htm);
    translatePage();
}


function setLanguage(lang_id) {
    //removeStorage("translation");
    dump(getStorage("translation"));
    if (typeof getStorage("translation") === "undefined" || getStorage("translation") == null || getStorage("translation") == "") {
        languageOptions.hide();
        ons.notification.confirm({
            message: 'Language file has not been loaded, would you like to reload?',
            title: dialog_title_default,
            buttonLabels: ['Yes', 'No'],
            animation: 'none',
            primaryButtonIndex: 1,
            cancelable: true,
            callback: function (index) {
                if (index == 0 || index == "0") {
                    getLanguageSettings();
                }
            }
        });
        return;
    }
    if (getStorage("translation").length <= 5) {
        onsenAlert("Translation file is not yet ready.");
        return;
    }
    if (!empty(lang_id)) {
        setStorage("default_lang", lang_id);
        if (!empty(translator)) {
            translator.lang(lang_id);
        } else {
            translator = $('body').translate({
                lang: lang_id,
                t: dictionary
            });
        }
    }
}


$.extend($.expr[':'], {
    'containsi': function (elem, i, match, array) {
        return (elem.textContent || elem.innerText || '').toLowerCase()
                .indexOf((match[3] || "").toLowerCase()) >= 0;
    }
});
String.prototype.replaceAll = function (search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};
var appdata = {
    search2: function (string) {
        if (string) {
            $('[modifier="tappable"]').removeClass('insearch').find('.restauran-title:containsi("' + string + '")').closest('[modifier="tappable"]').show().addClass('insearch');
            $('[modifier="tappable"]').find('.item_description:containsi("' + string + '")').closest('[modifier="tappable"]').show().addClass('insearch');
            $('[modifier="tappable"]').not('.insearch').hide();
            $('.my-row-bdr-nn-outer').addClass('my-row-bdr-nn-no');
        } else {
            $('#searhMenuInput').val('');
            $('[modifier="tappable"]').show();
            $('.my-row-bdr-nn-outer').removeClass('my-row-bdr-nn-no');
        }
    },
    pagename: '',
    ontranslationComplete: function () {

        var t = 0;
        if (this.pagename == 'page-home' || this.pagename == '') {

            $(document).on("keyup", ".search-input", function () {
                $('.pac-container').addClass('needsclick');
                $('.pac-item').addClass('needsclick');
            });
        }
        console.log(this.pagename);
        if (this.pagename == 'page-signup') {
            $('[name=contact_phone]').mask('(000)-000-0000');
        }

    },
    allHtml: '',
    texthide: function (obj) {
        $(obj).find('i').toggle();
        var target = $(obj).prev();
        if (target.hasClass('ellipsis')) {
            target.removeClass('ellipsis');
            target.css('white-space', 'normal');
            $('.navigation-bar__center').css('height', 'auto');
            $('.navigation-bar').css('height', 'auto');
        } else {
            target.addClass('ellipsis');
            $('.navigation-bar').css('height', '44px');
        }
    },
    shortText: function (obj) {
        var maxLength = 10;
        this.allHtml = obj.html();
        // if(this.allHtml.length>maxLength){
        if (!obj.hasClass('ellipsis')) {
            // obj.addClass('ellipsis').after('<span class="morebtn" onclick="popUpAddressSearh();"><i class="fa fa-pencil" style="font-size: 18px;"></i></span>');
        }
        //}
    },
    htmlTemplate: '',
    renderHtml: function (html, object) {
        $.each(object, function (index, value) {
            html = html.replaceAll(index, value);
        });
        return html;
    },
    creteHtml: function (template, data) {
        this.htmlTemplate = $('#' + template).html();
        if (this.htmlTemplate) {
            return this.renderHtml(this.htmlTemplate, data);
        }
    },
    creteHtmldata: function (template, data) {
        this.htmlTemplate = $('#' + template).html();
        var html = '';
        if (this.htmlTemplate) {
            $.each(data, function (index, value) {
                html = html + appdata.renderHtml(appdata.htmlTemplate, value);
            });
        }
        return html;
    },
    dataToHtml: function (html, object) {
        $.each(object, function (index, value) {
            html = html.replaceAll('_' + index + '_', value || '');
        });
        return html;
    },
    renderHtmldata: function (template, data) {
        this.htmlTemplate = $('#' + template).html();
        var html = '';
        if (this.htmlTemplate) {
            $.each(data, function (index, value) {
                html = html + appdata.dataToHtml(appdata.htmlTemplate, value);
            });
        }
        return html;
    }


}