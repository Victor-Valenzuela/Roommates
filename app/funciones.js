const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const nodemailer = require('nodemailer');
const moment = require('moment');

const nuevoRoommate = async () => {
    try {
        const { data } = await axios.get("https://randomuser.me/api");
        const roommate = data.results[0];
        const roommateData = {
            id: uuidv4().slice(30),
            nombre: `${roommate.name.first} ${roommate.name.last}`,
            email: roommate.email,
        };
        return roommateData;
    } catch (e) {
        console.error(e);
    }
};

const guardarRoommate = (roommate) => {
    let { roommates } = JSON.parse(fs.readFileSync("./data/roommates.json", "utf8"));
    const prueba = () => {
        const roommatesJSON = JSON.parse(fs.readFileSync("./data/roommates.json", "utf8"));
        roommatesJSON.roommates.push(roommate);
        fs.writeFileSync("./data/roommates.json", JSON.stringify(roommatesJSON));
        console.log("Nuevo roommate agregado con éxito");
    }
    if (roommates.length == 0) {
        prueba();
    } else {
        prueba();
        recalcularDeudas();
    }
};

const nuevoGasto = (gasto) => {
    gasto.id = uuidv4().slice(30);
    gasto.fecha = moment().locale("es-mx").format('LLLL');
    const gastosJSON = JSON.parse(fs.readFileSync("./data/gastos.json", "utf8"));
    gastosJSON.gastos.push(gasto);
    fs.writeFileSync("./data/gastos.json", JSON.stringify(gastosJSON));
    console.log("Nuevo gasto registrado con éxito")
}

const recalcularDeudas = () => {
    let { roommates } = JSON.parse(fs.readFileSync("./data/roommates.json", "utf8"));
    const { gastos } = JSON.parse(fs.readFileSync("./data/gastos.json", "utf8"));
    roommates = roommates.map((roommate) => {
        roommate.debe = 0;
        roommate.recibe = 0;
        roommate.balance = 0;
        roommate.total = 0;
        return roommate
    });
    gastos.forEach((gasto) => {
        roommates = roommates.map((roommate) => {
            let monto = Number((gasto.monto / (roommates.length)).toFixed(0));
            if (gasto.roommate == roommate.nombre) {
                roommate.recibe += monto * (roommates.length - 1);
            } else {
                roommate.debe -= monto
            };
            roommate.balance = (roommate.recibe + roommate.debe);
            roommate.total += monto;
            return roommate
        })
    });
    fs.writeFileSync("./data/roommates.json", JSON.stringify({ roommates }));
}

const editarGasto = (gasto, id) => {
    let { gastos } = JSON.parse(fs.readFileSync("./data/gastos.json", "utf8"));
    gastos = gastos.map((g) => {
        if (g.id == id) {
            const nuevoGasto = gasto;
            nuevoGasto.id = id
            return nuevoGasto;
        }
        return g;
    })
    fs.writeFileSync("./data/gastos.json", JSON.stringify({ gastos }));
    console.log("Gasto editado con éxito")
}

const eliminarGasto = (id) => {
    let { gastos } = JSON.parse(fs.readFileSync("./data/gastos.json", "utf8"));
    gastos = gastos.filter((g) => g.id !== id);
    fs.writeFileSync("./data/gastos.json", JSON.stringify({ gastos }));
    console.log("Gasto eliminado con éxito")
}
const enviarMails = async () => {
    const transport = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "5e60004d1dcbcc",
            pass: "2e9e0a8854d18d"
        }
    });

    const { roommates } = JSON.parse(fs.readFileSync("./data/roommates.json", "utf8"));
    const correos = roommates.map((c) => c.email);

    const { gastos } = JSON.parse(fs.readFileSync("./data/gastos.json", "utf8"));
    const gastoEmail = gastos.slice(gastos.length - 1)[0];

    const template = `${gastoEmail.roommate} ha realizado un gasto de ${gastoEmail.monto} en ${gastoEmail.descripcion} hoy ${gastoEmail.fecha} con Id: ${gastoEmail.id}`;

    const mailOptions = {
        from: 'no-reply@mail.com',
        to: correos,
        subject: 'Gasto nuevo',
        text: template,
    };

    try {
        const resultado = await transport.sendMail(mailOptions)
        return resultado;
    }
    catch (e) {
        throw e;
    }
};

module.exports = { nuevoRoommate, guardarRoommate, nuevoGasto, recalcularDeudas, editarGasto, eliminarGasto, enviarMails };
