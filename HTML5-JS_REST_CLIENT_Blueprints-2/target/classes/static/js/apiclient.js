var apiclient = (function () {
    const apiUrl = "http://localhost:8080/blueprints";

    return {
        getBlueprintsByAuthor: function (authname) {
            return $.ajax({
                url: `${apiUrl}/${authname}`,
                method: "GET"
            });
        },

        getBlueprintsByNameAndAuthor: function (authname, bpname) {
            return $.ajax({
                url: `${apiUrl}/${authname}/${bpname}`,
                method: "GET"
            });
        },

        postBlueprints: function (authname, bpname, points) {
            const blueprint = { author: authname, name: bpname, points: points };
            return $.ajax({
                url: apiUrl,
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify(blueprint)
            });
        }, 
        putBlueprints: function (authname, bpname, points) {
            const blueprint = { author: authname, name: bpname, points: points };
            return $.ajax({
                url: apiUrl,
                method: "PUT",
                contentType: "application/json",
                data: JSON.stringify(blueprint)
            });
        }
    };
})();
