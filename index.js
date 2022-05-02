const http = require("http");
const fs = require("fs");
const urlQ = require("url");
const { nuevoRoommate, guardarRoommate, nuevoGasto, recalcularDeudas, editarGasto, eliminarGasto, enviarMails } = require("./app/funciones");

const server = http.createServer((req, res) => {
    const { url, method } = req;
    if (url == "/" && method == "GET") {
        try {
            const index = fs.readFileSync("./public/index.html", "utf-8");
            res.writeHead(200, { "Content-Type": "text/html; charset=UTF-8" });
            res.end(index);
        } catch (e) {
            funError(res, e, "text/html");
        }
    } else if (url == "/roommate" && method == "POST") {
        nuevoRoommate()
            .then(async (roommate) => {
                guardarRoommate(roommate);
                res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
                res.end(JSON.stringify(roommate));
            })
            .catch((e) => {
                funError(res, e, "application/json");
                console.log("Error al registrar un nuevo roommate");
            });
    } else if (url == "/roommates" && method == "GET") {
        try {
            if (!fs.existsSync('./data/roommates.json')) fs.writeFileSync('./data/roommates.json', '{"roommates":[]}');
            const roommateJ = fs.readFileSync("./data/roommates.json", "utf-8");
            res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
            res.end(roommateJ);
        } catch (e) {
            funError(res, e, "application/json");
        }
    } else if (url == "/gasto" && method == "POST") {
        let body;
        req.on('data', (chunk) => {
            body = chunk.toString();
        });
        req.on('end', () => {
            let gastoOp = JSON.parse(body);
            try {
                nuevoGasto(gastoOp);
                recalcularDeudas();
                enviarMails()
                    .then(() => {
                        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
                        res.end(JSON.stringify({ code: 200, message: 'Tarea finalizada con éxito' }));
                        console.log("Correo enviado con éxito");
                    }).catch((error) => {
                        funError(res, error, "application/json");
                    });
            } catch (e) {
                funError(res, e, "application/json");
            }
        })

    } else if (url == "/gastos" && method == "GET") {
        try {
            if (!fs.existsSync('./data/gastos.json')) fs.writeFileSync('./data/gastos.json', '{"gastos":[]}');
            const gastosJ = fs.readFileSync("./data/gastos.json", "utf-8");
            res.writeHead(200, { "Content-Type": "application/json; charset=UTF-8" });
            res.end(gastosJ);
        } catch (e) {
            funError(res, e, "application/json");
        }

    } else if (url.startsWith("/gasto?id=") && method == "PUT") {
        try {
            const { id } = urlQ.parse(req.url, true).query;
            let body;
            req.on('data', (chunk) => {
                body = chunk.toString();
            });
            req.on('end', () => {
                let gasto = JSON.parse(body);
                editarGasto(gasto, id);
                recalcularDeudas();
                res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
                res.end();
            })
        } catch (e) {
            funError(res, e, "application/json");
        }
    } else if (url.startsWith("/gasto?id=") && method == "DELETE") {
        try {
            const { id } = urlQ.parse(req.url, true).query;
            eliminarGasto(id);
            recalcularDeudas();
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end();
        } catch (e) {
            funError(res, e, "application/json");
        }
    } else {
        funError(res, null, "text/html");
    }
});

const port = 3000;
server.listen(port, () => console.log(`Escuchando el puerto ${port}`));

const funError = (res, err, type) => {
    if (err) console.log(err);
    res.writeHead(404, { "Content-Type": type });
    if (type == "text/html") res.write("<p>Pagina no encontrada!</p>");
    res.end();
};
