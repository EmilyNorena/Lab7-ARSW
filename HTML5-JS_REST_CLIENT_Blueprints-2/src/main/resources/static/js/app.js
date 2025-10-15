var app = (function () {
    var selectedAuthor = null;
    var api = apiclient;
    var currentApiName = "apiclient";
    var canvas = null;
    var isBlueprint = false;
    var points = null;
    var addPointsBool = false;
    var tempPoints = [];

    function updateBlueprintsInfo(blueprints) {
        console.log("Datos recibidos de la API:", blueprints);

        if (!blueprints || !Array.isArray(blueprints) || blueprints.length === 0) {
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
                <td>${bp.points ? bp.points.length : 0}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-draw" data-bpname="${bp.name}">Draw</button>
                    <button class="btn btn-warning btn-sm btn-update" data-bpname="${bp.name}">Update</button>
                    <button class="btn btn-danger btn-sm btn-delete" data-bpname="${bp.name}">Delete</button>
                </td>
            </tr>`;
            $("#tabla-blueprints tbody").append(row);
        });

        let totalPoints = blueprints.reduce((sum, bp) => sum + (bp.points ? bp.points.length : 0), 0);
        $("#total").text(totalPoints);
        $("#autor-seleccionado").text(`${selectedAuthor}'s blueprints:`);

        $(".btn-draw").off('click').click(function () {
            let bpname = $(this).data("bpname");
            console.log("Draw clicked for:", bpname);
            app.drawBlueprint(selectedAuthor, bpname);
        });
        $(".btn-delete").off('click').click(function () {
            let bpname = $(this).data("bpname");
            app.deleteBlueprint(selectedAuthor, bpname);
        });
        $(".btn-update").off('click').click(function () {
            const bpname = $(this).data("bpname");
            console.log("Update clicked for:", bpname);
            app.updateBlueprint(selectedAuthor, bpname);
        });
    }

    async function drawBlueprint(author, bpname) {
        console.log(`Dibujando blueprint: ${bpname} de ${author}`);

        // Limpiar primero
        app.clearCanvas();
        isBlueprint = true;
        addPointsBool = false;

        try {
            const blueprint = await api.getBlueprintsByNameAndAuthor(author, bpname);
            console.log("Blueprint recibido:", blueprint);
            
            if (!blueprint || !blueprint.points || blueprint.points.length === 0) {
                console.log("No se encontraron puntos en el blueprint.");
                alert("No points found in this blueprint.");
                return;
            }

            $("#blueprint-title").text(`Current blueprint: ${bpname}`);

            let ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Configurar estilo
            ctx.strokeStyle = "blue";
            ctx.lineWidth = 3;
            ctx.beginPath();

            points = blueprint.points;
            console.log(`Puntos a dibujar: ${points.length}`, points);

            // Dibujar puntos
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Dibujar puntos como círculos para mejor visibilidad
            ctx.fillStyle = "red";
            points.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });

            console.log("Blueprint dibujado exitosamente");
        } catch (error) {
            console.error("Error obteniendo blueprint:", error);
            alert("Error loading blueprint.");
        }
    }

    function redrawCanvas(pointsToDraw) {
        if (!pointsToDraw || pointsToDraw.length === 0) return;
        
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar líneas
        ctx.strokeStyle = "green";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
        for (let i = 1; i < pointsToDraw.length; i++) {
            ctx.lineTo(pointsToDraw[i].x, pointsToDraw[i].y);
        }
        ctx.stroke();

        // Dibujar puntos
        ctx.fillStyle = "blue";
        pointsToDraw.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    return {
        clearCanvas: function () {
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            points = null;
            tempPoints = [];
            isBlueprint = false;
            $("#blueprint-title").text("Current blueprint: None");
        },
        getBlueprintsByAuthor: async function (authname) {
            selectedAuthor = authname;
            console.log(`Solicitando planos para el autor: ${authname} con ${currentApiName}`);

            try {
                let blueprints = [];
                if (api === apiclient) {
                    console.log("Usando apiclient...");
                    blueprints = await apiclient.getBlueprintsByAuthor(authname);
                } else {
                    console.log("Usando apimock...");
                    blueprints = await new Promise((resolve) => {
                        api.getBlueprintsByAuthor(authname, function (data) {
                            resolve(data || []);
                        });
                    });
                }
                console.log("Blueprints obtenidos:", blueprints);
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
                await app.getBlueprintsByAuthor(authname);
            } catch (err) {
                console.error("Error eliminando blueprint:", err);
                alert("Error deleting blueprint.");
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
            if (!b) {
                tempPoints = [];
            }
        },
        getaddPointsBool: function () {
            return addPointsBool;
        },
        drawAddForm: function () {
            app.setaddPointsBool(true);
            $("#blueprint-title").text(`Current blueprint: NEW`);
            app.clearCanvas();
            tempPoints = [];

            let addFormContainer = document.getElementById("add-form-container");
            addFormContainer.innerHTML = "";

            let form = document.createElement("div");
            form.style.display = "flex";
            form.style.flexDirection = "column";
            form.style.gap = "10px";

            let formTitle = document.createElement("h4");
            formTitle.textContent = "Add New Blueprint";
            formTitle.style.textAlign = "center";

            let bpAuthor = document.createElement("input");
            bpAuthor.type = "text";
            bpAuthor.placeholder = "Blueprints author";
            bpAuthor.style.padding = "8px";
            bpAuthor.style.border = "1px solid green";
            bpAuthor.style.borderRadius = "5px";

            let bpName = document.createElement("input");
            bpName.type = "text";
            bpName.placeholder = "Blueprints name";
            bpName.style.padding = "8px";
            bpName.style.border = "1px solid green";
            bpName.style.borderRadius = "5px";

            let instruction = document.createElement("p");
            instruction.textContent = "Click on the canvas to add new points to the blueprint you're creating.";
            instruction.style.fontSize = "1.1em";
            instruction.style.marginTop = "8px";

            let btnSave = document.createElement("button");
            btnSave.className = "btn btn-success";
            btnSave.textContent = "Save";
            btnSave.type = "button";

            form.appendChild(formTitle);
            form.appendChild(bpAuthor);
            form.appendChild(bpName);
            form.appendChild(instruction);
            form.appendChild(btnSave);
            addFormContainer.appendChild(form);

            // Event listener para guardar
            btnSave.onclick = async function (event) {
                event.preventDefault();
                const author = bpAuthor.value.trim();
                const name = bpName.value.trim();

                if (!author || !name) {
                    alert("Please enter both author and blueprint name.");
                    return;
                }

                if (tempPoints.length === 0) {
                    alert("Please add points to the canvas before saving.");
                    return;
                }

                try {
                    await apiclient.postBlueprints(author, name, tempPoints);
                    alert("Blueprint saved successfully!");
                    await app.getBlueprintsByAuthor(author);
                    addFormContainer.innerHTML = "";
                    app.clearCanvas();
                    app.setaddPointsBool(false);
                } catch (err) {
                    console.error("Error saving blueprint:", err);
                    alert("Error saving blueprint.");
                }
            };
        },
        redrawCanvas: redrawCanvas,
        updateBlueprint: async function (author, bpname) {
            console.log(`Actualizando blueprint: ${bpname} de ${author}`);
            app.clearCanvas();
            app.setaddPointsBool(true);

            const addFormContainer = document.getElementById("add-form-container");
            addFormContainer.innerHTML = "";

            try {
                const blueprint = await api.getBlueprintsByNameAndAuthor(author, bpname);
                console.log("Blueprint para actualizar:", blueprint);
                
                if (!blueprint || !blueprint.points) {
                    alert("No points found in this blueprint.");
                    return;
                }

                tempPoints = blueprint.points.slice();
                redrawCanvas(tempPoints);

                let form = document.createElement("div");
                form.style.display = "flex";
                form.style.flexDirection = "column";
                form.style.gap = "10px";

                let formTitle = document.createElement("h4");
                formTitle.textContent = `Update Blueprint: ${bpname}`;
                formTitle.style.textAlign = "center";

                let bpAuthor = document.createElement("input");
                bpAuthor.type = "text";
                bpAuthor.value = author;
                bpAuthor.placeholder = "Author";
                bpAuthor.style.padding = "8px";
                bpAuthor.style.border = "1px solid orange";
                bpAuthor.style.borderRadius = "5px";

                let bpName = document.createElement("input");
                bpName.type = "text";
                bpName.value = bpname;
                bpName.placeholder = "Blueprint name";
                bpName.style.padding = "8px";
                bpName.style.border = "1px solid orange";
                bpName.style.borderRadius = "5px";

                let instruction = document.createElement("p");
                instruction.textContent = "Click on the canvas to add new points or modify existing ones.";
                instruction.style.fontSize = "1.1em";

                let btnSave = document.createElement("button");
                btnSave.className = "btn btn-warning";
                btnSave.textContent = "Save Changes";
                btnSave.type = "button";

                form.appendChild(formTitle);
                form.appendChild(bpAuthor);
                form.appendChild(bpName);
                form.appendChild(instruction);
                form.appendChild(btnSave);
                addFormContainer.appendChild(form);

                btnSave.onclick = async function (event) {
                    event.preventDefault();
                    const newAuthor = bpAuthor.value.trim();
                    const newName = bpName.value.trim();

                    if (!newAuthor || !newName) {
                        alert("Please enter author and blueprint name.");
                        return;
                    }

                    if (tempPoints.length === 0) {
                        alert("Please add points to the canvas.");
                        return;
                    }

                    try {
                        await apiclient.putBlueprints(newAuthor, newName, tempPoints);
                        alert("Blueprint updated successfully!");
                        await app.getBlueprintsByAuthor(newAuthor);
                        addFormContainer.innerHTML = "";
                        app.clearCanvas();
                        app.setaddPointsBool(false);
                    } catch (err) {
                        console.error("Error updating blueprint:", err);
                        alert("Error updating blueprint.");
                    }
                };
            } catch (error) {
                console.error("Error obteniendo blueprint para actualizar:", error);
                alert("Error loading blueprint for update.");
            }
        },
        getTempPoints: function () {
            return tempPoints;
        },
        setTempPoints: function (newPoints) {
            tempPoints = newPoints;
        }
    };
})();

$(document).ready(function () {
    const canvas = document.getElementById("myCanvas");
    if (!canvas) {
        console.error("Canvas not found!");
        return;
    }
    
    app.setCanvas(canvas);
    console.log("Canvas inicializado:", canvas);

    function handleCanvasClick(event) {
        if (!app.getaddPointsBool()) {
            console.log("Modo edición desactivado");
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        console.log(`Click en canvas: x=${x}, y=${y}`);
        
        const currentTempPoints = app.getTempPoints();
        currentTempPoints.push({ x, y });
        app.setTempPoints(currentTempPoints);
        
        app.redrawCanvas(currentTempPoints);
    }

    // Configurar eventos
    $("#btn-get-blueprints").click(async function () {
        const autor = $("#input-autor").val().trim();
        if (!autor) {
            alert("Please enter a valid author name.");
            return;
        }

        try {
            await app.getBlueprintsByAuthor(autor);
        } catch (err) {
            console.error("Error:", err);
            alert("Error loading blueprints.");
        }
    });

    $("#btn-switch-api").click(function () {
        app.switchApi();
    });

    $("#btn-add").click(function () {
        console.log("Add button clicked");
        app.drawAddForm();
    });

    canvas.addEventListener("click", handleCanvasClick);
    
    console.log("Aplicación inicializada correctamente");
});