var app = (function () {
    var selectedAuthor = null;
    var api = apimock;
    var currentApiName = "apimock";
    var canvas = null;
    var isBlueprint = false;
    var points = null;

    function updateBlueprintsInfo(blueprints) {
        console.log("Datos recibidos de la API:", blueprints);

        if (!Array.isArray(blueprints) || blueprints.length === 0) {
            console.log("No hay planos para este autor.");
            $("#tabla-blueprints tbody").empty();
            $("#total").text("0");
            $("#autor-seleccionado").text("No blueprints found.");
            return;
        }

        $("#tabla-blueprints tbody").empty();

        blueprints.forEach(bp => {
            let row = `<tr>
                <td>${bp.name}</td>
                <td>${bp.points.length}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-draw" data-bpname="${bp.name}">Draw</button>
                    <button class="btn btn-warning btn-sm delete-btn" data-bpname="${bp.name}"">Update</button>
                    <button class="btn btn-danger btn-sm delete-btn" data-bpname="${bp.name}"">Delete</button>
                </td>
            </tr>`;
            $("#tabla-blueprints tbody").append(row);
        });

        let totalPoints = blueprints.reduce((sum, bp) => sum + bp.points.length, 0);
        $("#total").text(totalPoints);
        $("#autor-seleccionado").text(`${selectedAuthor}´s blueprints:`);

        $(".btn-draw").click(function () {
            let bpname = $(this).data("bpname");
            app.drawBlueprint(selectedAuthor, bpname);
        });
    }

    function drawBlueprint(author, bpname) {
        console.log(`Dibujando blueprint: ${bpname} de ${author}`);

        api.getBlueprintsByNameAndAuthor(author, bpname, function (blueprint) {
            if (!blueprint || !blueprint.points) {
                console.log("No se encontraron puntos en el blueprint.");
                return;
            }

            $("#blueprint-title").text(`Current blueprint: ${bpname}`);
            isBlueprint = true;

            let ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.beginPath();
            points = blueprint.points;
            ctx.moveTo(points[0].x, points[0].y);

            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        });
    }

    return {
        getBlueprintsByAuthor: function (authname) {
            selectedAuthor = authname;
            console.log(`Solicitando planos para el autor: ${authname} con ${currentApiName}`);

            api.getBlueprintsByAuthor(authname, function (blueprints) {
                if (!blueprints) {
                    console.log("El API devolvió un valor nulo o indefinido.");
                    updateBlueprintsInfo([]);
                } else {
                    updateBlueprintsInfo(blueprints);
                }
            });
        },
        drawBlueprint: drawBlueprint,
        switchApi: function () {
            if (api === apimock) {
                api = apiclient;
                currentApiName = "apiclient";
            } else {
                api = apimock;
                currentApiName = "apimock";
            }
            $("#btn-switch-api").text("Using: " + currentApiName);
            console.log("Ahora usando:", currentApiName);
        },
        setCanvas: function (c) {
            canvas = c;
        },
        getIsBlueprint: function () {
            return isBlueprint;
        },
        getPoints: function () {
            return points;
        }
    };
})();

$(document).ready(function () {
    var canvas = document.getElementById("myCanvas");
    app.setCanvas(canvas);
    $("#btn-get-blueprints").click(function () {
        let autor = $("#input-autor").val().trim();
        if (autor !== "") {
            app.getBlueprintsByAuthor(autor);
        } else {
            console.log("Ingrese un autor válido.");
        }
    });

    $("#btn-switch-api").click(function () {
        app.switchApi();
    });

    if (window.PointerEvent) { // Navegador soporta PointerEvent
        canvas.addEventListener("pointerdown", function (event) {
            if (app.getIsBlueprint()) {
                const rect = canvas.getBoundingClientRect(); // Posición del canvas
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                console.log(`Nuevo punto en: (${x}, ${y})`);
                app.getPoints().push({ x: x, y: y });

                let ctx = canvas.getContext("2d");
                let points = app.getPoints();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }
        });
    } else {
        canvas.addEventListener("mousedown", function (event) {
            if (app.getIsBlueprint()) {
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                console.log(`Nuevo punto en: (${x}, ${y})`);
                app.getPoints().push({ x: x, y: y });

                let ctx = canvas.getContext("2d");
                let points = app.getPoints();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();
            }
        });


    }
});
