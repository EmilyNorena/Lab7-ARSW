var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = "black";
        ctx.fill();
    };

    var drawPolygon = function (points) {
        if (!points || points.length < 3) return;
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(255,0,0,0.2)";
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


    var connectAndSubscribe = function (drawingId) {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);

            var topicPoints = "/topic/newpoint." + drawingId;
            stompClient.subscribe(topicPoints, function (message) {
                var theObject = JSON.parse(message.body);
                var pt = new Point(theObject.x, theObject.y);
                addPointToCanvas(pt);
            });

            var topicPolygon = "/topic/newpolygon." + drawingId;
            stompClient.subscribe(topicPolygon, function (message) {
                var polygon = JSON.parse(message.body);
                drawPolygon(polygon.points);
            });

            console.log("Subscribed to topics: " + topicPoints + " and " + topicPolygon);
        });
    };

    return {
        init: function () {
            var canvas = document.getElementById("canvas");

            canvas.addEventListener("click", function (evt) {
                var pos = getMousePosition(evt);
                app.publishPoint(pos.x, pos.y);
            });
            document.getElementById("connectBtn").addEventListener("click", function () {
                var drawingId = document.getElementById("drawingId").value;
                if (drawingId) {
                    connectAndSubscribe(drawingId);
                } else {
                    alert("Ingrese un ID de dibujo válido");
                }
            });
        },
        publishPoint: function (px, py) {
            var drawingId = document.getElementById("drawingId").value;
            if (!drawingId) {
                alert("Debe conectarse a un dibujo antes de publicar puntos");
                return;
            }

            var pt = new Point(px, py);
            addPointToCanvas(pt);

            if (stompClient && stompClient.connected) {
                stompClient.send("/app/newpoint." + drawingId, {}, JSON.stringify(pt));
            } else {
                alert("No hay conexión activa con el servidor WebSocket");
            }
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Disconnected");
        }
    };

})();