var db;
let os_user;
let os_channel;
let os_msg;
var channel_reqd;
var user_name;
var submit_msg_count;

window.onload = function () {

    if (!localStorage.getItem('window')) {
        localStorage.setItem('window', 1);

        // open database
        db = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var request = db.open('Flack_DB');

        // error handler
        request.onerror = function() {
            // If an error occurs with the request, log what it is
            console.log("There has been an error with retrieving your data: " + request.error);
          };

        // success handler
        request.onsuccess = function (event) {
            db = event.target.result;
            console.log('Database opened succesfully.Name : ' + db);

            // open user table
            var transaction_user = db.transaction(['user'], 'readonly');
            os_user = transaction_user.objectStore('user');
            var request_user = os_user.get(1);

            request_user.onerror = function() {
                // If an error occurs with the request, log what it is
                console.log("There has been an error with retrieving your data: " + request_user.error);
              };

            request_user.onsuccess = function () {
                // Do something with the request.result!
                if (request_user.result != undefined) {
                    document.querySelector('#display_username').innerHTML = request_user.result.name;
                    alert("User name : " + request_user.result.name);
                    user_name = request_user.result.name;
                    document.getElementById('name').style.visibility = "hidden";
                    document.getElementById('label_username').style.visibility = "hidden";
                    document.getElementById('input_username').style.visibility = "hidden";
                    document.getElementById('submit_username').style.visibility = "hidden";
                }
                else alert('Please register');
            };

            var transaction_channel = db.transaction(['channel'], 'readonly');
            os_channel = transaction_channel.objectStore('channel');
            let request_channel = os_channel.openCursor();

            request_channel.onsuccess = function () {
                let cursor = request_channel.result;
                if (cursor) {
                    const li_channelname = document.createElement('li');
                    li_channelname.innerHTML = cursor.value['name'];
                    document.querySelector('#display_channelname').append(li_channelname);
                    cursor.continue();
                }
                // else {
                //     console.log("No more channels");
                // }
            };
            request_channel.onerror = function() {
                // If an error occurs with the request, log what it is
                console.log("There has been an error with retrieving your data: " + request_channel.error);
              };

        };

        // create table name channel and set-up primary key and columns
        request.onupgradeneeded = function (event) {
            db = event.target.result;

            // table one : channel
            os_channel = db.createObjectStore('channel', { keyPath: 'name', unique: true });
            // os_channel.createIndex('name', 'name', { unique: true });

            // table two : user
            os_user = db.createObjectStore('user', { keyPath: 'id', autoIncrement: true });
            os_user.createIndex('name', 'name', { unique: true });

            // table three : message
            os_msg = db.createObjectStore('message', { keyPath: 'id', autoIncrement: true });
            os_msg.createIndex('user', 'user', { unique: false });
            os_msg.createIndex('channel', 'channel', { unique: false });
            os_msg.createIndex('time', 'time', { unique: false });
        };
    }

    else {
        alert('You are not allowed to open Flack in more than one browser window!!')
    }
}

function ErrorProcessing(event) {
    console.log('Error in processing request : ' + event.target.errorCode);
}


window.onunload = function () {
    if (localStorage.getItem('window')) {
        localStorage.removeItem('window');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("input_message").style.visibility = "hidden";
    document.getElementById("submit_message").style.visibility = "hidden";

    document.getElementById("submit_message").onclick = () => {
        const msg = document.querySelector('#input_message').value;
        const time = new Date();
        document.getElementById("input_message").value = "";
        submit_msg_count = 0;
        socket.emit('submit msg', { 'msg': msg, 'channel': channel_reqd, 'time': time, 'user': user_name });
    };

    document.querySelector('#display_channelname').addEventListener("click", function (e) {
        //recognise which channel is clicked
        if (e.target && e.target.nodeName == "LI") {
            channel_reqd = e.target.textContent;
            // console.log('channel reqd : ');
            // console.log(channel_reqd);

            var x = document.getElementById('label_msg').childNodes;
            var flag = true;
            for (var i = 0; i < x.length; i++) {
                // console.log(x[i].className);
                if (x[i].className == channel_reqd) {
                    flag = false;
                    // break;
                }
            }

            if (flag) {
                document.getElementById("input_message").style.visibility = "visible";
                document.getElementById("submit_message").style.visibility = "visible";
                document.getElementById("input_message").value = "";

                var transaction_msg = db.transaction(['message'], 'readonly');
                os_msg = transaction_msg.objectStore('message');
                let request_msg = os_msg.openCursor();

                request_msg.onsuccess = function () {
                    let cursor_msg = request_msg.result;
                    // console.log(cursor_msg);

                    if (cursor_msg) {

                        if (cursor_msg.value['channel'] == channel_reqd) {
                            var li_msg = document.createElement('div');
                            li_msg.innerHTML = cursor_msg.value['message'];
                            li_msg.className = cursor_msg.value['channel'];

                            var u_name = document.createElement('label');
                            u_name.innerText = cursor_msg.value['user'];
                            u_name.className = 'user';
                            li_msg.append(u_name);

                            var time = document.createElement('label');
                            var current_time = new Date(cursor_msg.value['time']);
                            var day = current_time.getDate().toString() + "/" + (current_time.getMonth() + 1).toString() + " "
                                + current_time.getHours().toString() + ":" + current_time.getMinutes().toString();
                            time.innerHTML = day + " ";
                            time.className = 'time';
                            li_msg.append(time);

                            document.querySelector('#label_msg').append(li_msg);
                            // console.log('msg : ');
                            // console.log(li_msg);
                        }

                        cursor_msg.continue();
                    }
                    else {
                        console.log("No more channels");
                    }
                    const li_msg_old = document.getElementById('label_msg').childNodes;
                    // console.log(li_msg_old.length);
                    li_msg_old.forEach(el => {
                        if (el.className != channel_reqd) {
                            // console.log(el);
                            document.getElementById('label_msg').removeChild(el);
                        }
                    });
                };
            }
        }
    });

    // declare websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    // connect Web socket
    socket.on('connect', () => {
        document.querySelector('#submit_username').disabled = true;
        document.querySelector('#submit_channelname').disabled = true;
        var cells = document.getElementsByTagName("input");

        //button to click only if text is keyed in textbox
        for (let cell of cells) {
            let input_id = cell.id;
            let element_name = 'submit' + input_id.substring(input_id.indexOf('_'), input_id.length);

            document.getElementById(input_id).onkeyup = () => {
                if (document.getElementById(input_id).value.length > 0) {
                    document.getElementById(element_name).disabled = false;
                    // console.log('disabled ' + element_name);
                }
                else {
                    document.getElementById(element_name).disabled = true;
                    // console.log('enabled ' + element_name);
                }
            };
        }

        // add user to DB and emit "submit user" event
        document.querySelector('#submit_username').onclick = () => {
            user_name = document.querySelector('#input_username').value;
            let newUser = { name: user_name };
            transaction_user = db.transaction(['user'], 'readwrite');
            os_user = transaction_user.objectStore('user');

            // make a request to add our newItem object to the object store
            var addUser = os_user.add(newUser);
            addUser.onsuccess = function () {
                socket.emit('submit user', { 'user': user_name });
            };
        };

        // add channel to DB and emit "submit channel" event
        document.querySelector('#submit_channelname').onclick = () => {
            // var channel_unique = false;
            const channel_name = document.querySelector('#input_channelname').value;

            transaction_channel = db.transaction(['channel'], 'readonly');
            os_channel = transaction_channel.objectStore('channel');
            document.querySelector('#input_channelname').value = "";

            var keyRangeValue = IDBKeyRange.only(channel_name);
            // console.log(keyRangeValue);

            let request_channel = os_channel.openCursor(keyRangeValue);
            // console.log(request_channel);

            request_channel.onsuccess = function () {
                let cursor_channel = request_channel.result;

                if (cursor_channel == null) {
                    // console.log('created');
                    socket.emit('submit channel', { 'channel': channel_name });
                }
                else {
                    alert('channel exists!!');
                }
            };

        };
    });

    // emit events from socket when a user name is announced, display it on screen
    socket.on('announce user', data => {
        const label_username = document.querySelector('#label_username');
        label_username.innerHTML = `${data.user}`;

    });

    // emit events from socket when a channel name is announced, display it on screen
    socket.on('announce channel', data => {
        const li_channelname = document.createElement('li');
        li_channelname.innerHTML = `${data.channel}`;

        document.querySelector('#display_channelname').append(li_channelname);

        const channel_name = `${data.channel}`;
        let newChannel = { name: channel_name };
        transaction_channel = db.transaction(['channel'], 'readwrite');
        os_channel = transaction_channel.objectStore('channel');

        // make a request to add our newItem object to the object store
        var addChannel = os_channel.add(newChannel);
        addChannel.onsuccess = function () {
            // console.log(addChannel);
        };
    });

    // emit events from socket when a channel name is announced, display it on screen
    socket.on('announce msg', data => {
        // var recieve_msg_count;
        const li_channelname = document.createElement('div');
        li_channelname.innerHTML = `${data.msg}`;
        li_channelname.className = `${data.channel}`;

        var u_name = document.createElement('label');
        u_name.innerText = `${data.user}`;
        u_name.className = 'user';
        li_channelname.append(u_name);

        var time = document.createElement('label');
        var current_time = new Date(`${data.time}`);
        // console.log(`${data.time}`);
        var day = current_time.getDate().toString() + "/" + (current_time.getMonth() + 1).toString() + " "
            + current_time.getHours().toString() + ":" + current_time.getMinutes().toString();
        time.innerHTML = day;

        time.className = 'time';
        li_channelname.append(time);
        // if (submit_msg_count === 0 || (user_name != `${data.user}` && submit_msg_count === undefined)) {
            let newMsg = { message: `${data.msg}`, user: `${data.user}`, channel: `${data.channel}`, time: `${data.time}` };
            transaction_message = db.transaction(['message'], 'readwrite');
            os_msg = transaction_message.objectStore('message');

            var addMsg = os_msg.add(newMsg);
            addMsg.onsuccess = function () {
                submit_msg_count = 1;
                // console.log(addMsg);
            };
        // }
        var flag_msg = false;

        const existing_msg = document.getElementById('label_msg').childNodes;
        // console.log(existing_msg);
        // console.log(existing_msg.length);
        if (existing_msg.length == 0) {
            flag_msg = true;
        }
        else if (existing_msg[0].className == li_channelname.className) {
            // console.log(existing_msg[0]);
            flag_msg = true;
        }

        if (flag_msg) {
            document.querySelector('#label_msg').append(li_channelname);
            // console.log('done');
        }
    });

});
