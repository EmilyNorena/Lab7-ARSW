var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function(point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
    };

    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function(drawingId) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function(frame) {
            console.log('Connected: ' + frame);

            var topicName = "/topic/newpoint." + drawingId;
            stompClient.subscribe(topicName, function(message) {
                var theObject = JSON.parse(message.body);
                var pt = new Point(theObject.x, theObject.y);
                addPointToCanvas(pt);
            });

            console.log("Subscribed to topic: " + topicName);
        });
    };


    

    return {

        init: function() {
            var canvas = document.getElementById("canvas");
            canvas.addEventListener("click", function(evt) {
                var pos = getMousePosition(evt);
                app.publishPoint(pos.x, pos.y);
            });

            document.getElementById("connectBtn").addEventListener("click", function() {
                var drawingId = document.getElementById("drawingId").value;
                if (drawingId) {
                    connectAndSubscribe(drawingId);
                } else {
                    alert("Ingrese un ID de dibujo válido");
                }
            });
        },


        publishPoint: function (px, py) {
            var drawingId = $("#drawingId").val();
            if (!drawingId) {
                alert("Debe conectarse a un dibujo antes de publicar puntos");
                return;
            }

            var pt = new Point(px, py);
            addPointToCanvas(pt);

            if (stompClient && stompClient.connected) {
                stompClient.send("/topic/newpoint." + drawingId, {}, JSON.stringify(pt));
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();