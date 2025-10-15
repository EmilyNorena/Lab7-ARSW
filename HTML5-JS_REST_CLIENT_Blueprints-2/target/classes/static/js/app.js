var app = (function () {
    var selectedAuthor = null;
    var api = apiclient;
    var currentApiName = "apiclient";
    var canvas = null;
    var isBlueprint = false;
    var points = null;
    var addPointsBool = false;

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
                    <button class="btn btn-warning btn-sm btn-update" data-bpname="${bp.name}"">Update</button>
                    <button class="btn btn-danger btn-sm btn-delete" data-bpname="${bp.name}"">Delete</button>
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
        $(".btn-delete").click(function () {
            let bpname = $(this).data("bpname");
            app.deleteBlueprint(selectedAuthor, bpname);
        });
        $(".btn-update").click(function () {
            const bpname = $(this).data("bpname");
            app.updateBlueprint(selectedAuthor, bpname);
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
        clearCanvas: function () {
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points = null;          // Limpiamos los puntos actuales
            isBlueprint = false;    // Reseteamos el estado
            tempPoints = [];        // Si quieres limpiar puntos temporales también
        },
        getBlueprintsByAuthor: async function (authname) {
            selectedAuthor = authname;
            console.log(`Solicitando planos para el autor: ${authname} con ${currentApiName}`);

            try {
                let blueprints = [];
                if (api === apiclient) {
                    blueprints = await apiclient.getBlueprintsByAuthor(authname);
                } else {
                    return new Promise((resolve, reject) => {
                        api.getBlueprintsByAuthor(authname, function (data) {
                            if (!data) data = [];
                            updateBlueprintsInfo(data);
                            resolve(data);
                        });
                    });
                }

                updateBlueprintsInfo(blueprints);
                return blueprints;
            } catch (err) {
                console.error("Error obteniendo blueprints:", err);
                updateBlueprintsInfo([]);
                return [];
            }
        },
        deleteBlueprint: async function (authname, bpname) {
            try {
                if (api === apiclient) {
                    await apiclient.deleteBlueprints(authname, bpname);
                    alert("Blueprint deleted successfully!");
                }
                app.getBlueprintsByAuthor(authname);
            } catch (err) {
                console.error("Error eliminando blueprint:", err);
            }
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
        },
        setaddPointsBool: function (b) {
            addPointsBool = b;
        },
        getaddPointsBool: function () {
            return addPointsBool;
        },
        drawAddForm: function () {
            app.setaddPointsBool(true);
            $("#blueprint-title").text(`Current blueprint: NEW`);
            app.clearCanvas();

            let addFormContainer = document.getElementById("add-form-container");
            addFormContainer.innerHTML = "";

            let bpAuthor = document.createElement("input");
            let bpName = document.createElement("input");
            let form = document.createElement("form");
            let instruction = document.createElement("p");
            let formTitle = document.createElement("h4");
            let btnSave = document.createElement("button");

            form.style.flexDirection = "column";
            formTitle.textContent = "Add New Blueprint";
            formTitle.style.textAlign = "center";

            bpAuthor.type = "text";
            bpName.type = "text";
            bpAuthor.placeholder = "Blueprints author";
            bpName.placeholder = "Blueprints name";
            btnSave.id = "btn-save";
            btnSave.className = "btn btn-success";
            btnSave.textContent = "Save";

            [bpAuthor, bpName].forEach(input => {
                input.style.padding = "8px";
                input.style.border = "1px solid green";
                input.style.borderRadius = "5px";
            });

            instruction.textContent = "Click on the canvas to add new points to the blueprint you’re creating.";
            instruction.style.fontSize = "1.1em";
            instruction.style.marginTop = "8px";

            form.appendChild(formTitle);
            form.appendChild(bpAuthor);
            form.appendChild(bpName);
            form.appendChild(instruction);
            form.appendChild(btnSave);
            addFormContainer.appendChild(form);
        },
        updateBlueprint: function (author, bpname) {
            console.log(`Actualizando blueprint: ${bpname} de ${author}`);
            app.clearCanvas();
            app.setaddPointsBool(true);

            const addFormContainer = document.getElementById("add-form-container");
            addFormContainer.innerHTML = "";

            // Obtenemos el blueprint actual
            api.getBlueprintsByNameAndAuthor(author, bpname, function (blueprint) {
                if (!blueprint || !blueprint.points) {
                    alert("No se encontraron puntos en el blueprint.");
                    return;
                }

                points = blueprint.points.slice(); // copiamos los puntos actuales

                // Redibujamos en el canvas
                const ctx = canvas.getContext("2d");
                redrawCanvas(points, ctx);

                // Creamos formulario
                const form = document.createElement("form");
                form.style.flexDirection = "column";

                const formTitle = document.createElement("h4");
                formTitle.textContent = `Update Blueprint: ${bpname}`;
                formTitle.style.textAlign = "center";

                const bpAuthor = document.createElement("input");
                const bpName = document.createElement("input");
                bpAuthor.type = "text";
                bpName.type = "text";
                bpAuthor.value = author;
                bpName.value = bpname;
                bpAuthor.placeholder = "Author";
                bpName.placeholder = "Blueprint name";

                const instruction = document.createElement("p");
                instruction.textContent = "Click on the canvas to add new points or modify existing ones.";
                instruction.style.fontSize = "1.1em";
                instruction.style.marginTop = "8px";

                const btnSave = document.createElement("button");
                btnSave.id = "btn-update-save";
                btnSave.className = "btn btn-warning";
                btnSave.textContent = "Save Changes";

                [bpAuthor, bpName].forEach(input => {
                    input.style.padding = "8px";
                    input.style.border = "1px solid orange";
                    input.style.borderRadius = "5px";
                    form.appendChild(input);
                });

                form.appendChild(formTitle);
                form.appendChild(instruction);
                form.appendChild(btnSave);
                addFormContainer.appendChild(form);

                // Guardar cambios
                $(document).off("click", "#btn-update-save"); // evitamos duplicar el event handler
                $(document).on("click", "#btn-update-save", async function (event) {
                    event.preventDefault();

                    const newAuthor = bpAuthor.value.trim();
                    const newName = bpName.value.trim();

                    if (!newAuthor || !newName || !points || points.length === 0) {
                        alert("Please enter author, blueprint name, and points before saving.");
                        return;
                    }

                    try {
                        await apiclient.putBlueprints(newAuthor, newName, points);
                        alert("Blueprint updated successfully!");

                        await app.getBlueprintsByAuthor(newAuthor);
                        addFormContainer.innerHTML = "";
                        app.clearCanvas();
                        app.setaddPointsBool(false);
                    } catch (err) {
                        console.error("Error updating blueprint:", err);
                        alert("Error updating blueprint. Check console.");
                    }
                });
            });
        }

    };
})();

$(document).ready(function () {
    const canvas = document.getElementById("myCanvas");
    app.setCanvas(canvas);
    let tempPoints = [];

    $("#btn-get-blueprints").click(async function () {
        const autor = $("#input-autor").val().trim();
        if (!autor) return console.log("Ingrese un autor válido.");

        try {
            await app.getBlueprintsByAuthor(autor); // llama la función async y actualiza tabla
        } catch (err) {
            alert("No blueprints found for this author.");
            console.error(err);
        }
    });


    $("#btn-switch-api").click(function () {
        app.switchApi();
    });

    $("#btn-add").click(function () {
        app.drawAddForm();
        tempPoints = [];
    });

    $("#btn-add").click(function () {
        app.drawAddForm();
        tempPoints = [];
    });

    $(document).on("click", "#btn-save", async function (event) {
        event.preventDefault();

        if (!app.getaddPointsBool() || tempPoints.length === 0) return;

        const author = $("#add-form-container input[placeholder='Blueprints author']").val();
        const name = $("#add-form-container input[placeholder='Blueprints name']").val();
        const search_bar = document.getElementById("input-autor");

        if (!author || !name) {
            alert("Please enter both author and blueprint name before saving.");
            return;
        }

        try {
            const response = await apiclient.postBlueprints(author, name, tempPoints);
            alert("Blueprint saved successfully!");
            console.log("Nuevo blueprint guardado:", response);

            const blueprints = await apiclient.getBlueprintsByAuthor(author);
            app.getBlueprintsByAuthor(author);

            $("#add-form-container").empty();
            app.clearCanvas();
            tempPoints = [];

            app.setaddPointsBool(false);
        } catch (err) {
            console.error("Error guardando blueprint:", err);
            alert("Error saving blueprint. Check console.");
        }
    });

    function handleCanvasClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const ctx = canvas.getContext("2d");

        if (app.getIsBlueprint()) {
            app.getPoints().push({ x, y });
            redrawCanvas(app.getPoints(), ctx);
        }

        if (app.getaddPointsBool()) {
            tempPoints.push({ x, y });
            redrawCanvas(tempPoints, ctx);
        }
    }

    function redrawCanvas(points, ctx) {
        if (!points || points.length === 0) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    canvas.addEventListener(window.PointerEvent ? "pointerdown" : "mousedown", handleCanvasClick);
});


