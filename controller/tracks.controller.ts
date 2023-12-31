import fs from "fs";
import { upload } from "./Storage.controller.js";
import { dirname,resolve } from "path";
import { Request, Response } from "express";
import { db } from "./conection.controller.js";

// Promisify the query function
const queryAsync = (sql: string, values: any) => {
  return new Promise<Array<object>>((resolve, reject) => {
    db.query(sql, values, (err: any, results: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Logic
const searchInDb = async (publicId: number) => {
  try {
    const resultados = await queryAsync(
      `SELECT * FROM Canciones WHERE id_public = ${publicId}`,
      []
    );
    return resultados[0];
  } catch (err) {
    console.error("fasho");
    return null;
  }
};

const addNewTrack = async (content: any) => {
  console.log(content.title);
  try {
    const resultados = await queryAsync(
      "INSERT INTO Canciones (titulo, id_artista, id_album, duracion, id_public, id_genero) VALUES (?, ?, ?, ?, ?, ?)",
      [
        content.title,
        content.artist_id,
        content.album_id,
        content.sec_duration,
        content.gender_id,
        content.artist_id,
      ]
    );
    return resultados;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Router functions
export async function playTrack(req: Request, res: Response): Promise<void> {
  const idOfTrack: string = req.params.id;
  const realIdOfTrack: any = await searchInDb(Number(idOfTrack));
  const realIdOfTrackId = realIdOfTrack.id_cancion;
  const currentDir = dirname("../Streaming-music-app/persistencia/1.mp3");
  if (!realIdOfTrack) {
    res.status(404).send({ message: "Not found", status: 404 });
  } else {
    const goToTrack: string = currentDir + "/" + idOfTrack + ".mp3";
    console.log(goToTrack);

    try {
      if (!fs.existsSync(goToTrack)) {
        res.status(404).send({ message: "File not found", status: 404 });
        return;
      }

      const stat = fs.statSync(goToTrack);
      console.log(stat);

      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Length": stat.size.toString(),
      });

      const stream = fs.createReadStream(goToTrack);

      stream.on("data", (chunk) => {
        res.write(chunk);
      });

      stream.on("end", () => {
        res.end();
      });

      stream.on("error", (err) => {
        console.error(`Error durante la transmisión: ${err.message}`);
        res.sendStatus(500);
      });
    } catch (error) {
      res.status(500).json({ status: 500 });
    }
  }
}

export async function uploadTrack(req: Request, res: Response) {
  const resp: any = await addNewTrack(req.body);
  const idToChange: number = resp.insertId + 1;
  
  // Definir el nombre del archivo
  const nombreArchivo = `${idToChange}.mp3`;

  // Agregar el nombre del archivo a la solicitud (req) si es necesario
  req.body.nombreArchivo = nombreArchivo;
}