const target =
  "https://pmb.uniku.ac.id/hasil-seleksi-penerimaan-mahasiswa-baru-universitas-kuningan-gelombang-1-tahun-akademik-2022-2023/";

const tables = [
  "#tablepress-33 > tbody > tr",
  "#tablepress-34 > tbody > tr",
  "#tablepress-35 > tbody > tr",
  "#tablepress-36 > tbody > tr",
  "#tablepress-37 > tbody > tr",
];

const path = require("path");
const fs = require("fs");

// fungsi logger
const path_log = path.join(__dirname, "log.txt");
fs.rmSync(path_log, {
  force: true,
  recursive: true,
});
const logger = fs.createWriteStream(path_log, { flags: "w" });

const axios = require("axios");
const http = require("http");
const GetHTML = async (url) => {
  const { data } = await axios({
    url,
    method: "get",
    httpAgent: new http.Agent({ keepAlive: true }),
  });
  return data;
};

const cheerio = require("cheerio");
const html_to_cheerio = (html_string) => {
  return cheerio.load(html_string);
};

// Main
(async () => {
  // START !!

  try {
    // get html
    const html = await GetHTML(target);
    // buat format cheerio
    const $ = html_to_cheerio(html);

    // kumpulin semua data di beberapa tables disini
    let result = [];

    let o = 0; // index
    let finish = false;
    while (!finish) {
      const table_selector = tables[o]; // index of tables
      // baca semua row di table ini
      $(table_selector).each((i, b) => {
        const nama = String($(b).find("td:nth-child(2)").text()).trim();
        const jurusan = String($(b).find("td:nth-child(3)").text()).trim();
        const keterangan = String($(b).find("td:nth-child(5)").text()).trim();
        if (keterangan === "LULUS" && jurusan === "Sistem Informasi") {
          // for build output json
          result.push({ nama, jurusan, keterangan });
          // for log di txt
          logger.write(`${nama}|${jurusan}|${keterangan}\n`);
        }
      });
      if (o > tables.length - 2) {
        finish = true;
      }
      o++;
    }

    // no urut
    result = result.map((v, i) => {
      // bikin meta baru, no
      v.no = i + 1;
      return v;
    });

    // log versi JSON
    const path_json = "log.json";
    fs.rmSync(path_json, {
      force: true,
      recursive: true,
    });
    fs.writeFileSync(path_json, JSON.stringify(result, null, 2));

    // END !!
    console.log("Finish...");
  } catch (error) {
    const isAxiosError = error?.response?.data?.message;
    const message = isAxiosError ? error.response.data.message : error.message;
    console.log({
      code: isAxiosError ? error.response.status : 500,
      message,
    });
  }
})();
