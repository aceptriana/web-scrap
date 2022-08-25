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
const log_path = path.join(__dirname, "log.txt");
fs.rmSync(log_path, {
  force: true,
  recursive: true,
});
const logger = fs.createWriteStream(log_path, { flags: "w" });

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

  // get html
  try {
    const html = await GetHTML(target);
    const $ = html_to_cheerio(html);

    // kumpulin semua data di beberapa tables
    let result = [];

    let o = 0;
    let finish = false;
    while (!finish) {
      const table_selector = tables[o];
      $(table_selector).each((i, b) => {
        const keterangan = String($(b).find("td:nth-child(5)").text()).trim();
        const nama = $(b).find("td:nth-child(2)").text();
        const jurusan = $(b).find("td:nth-child(3)").text();
        if (keterangan === "LULUS" && jurusan === "Sistem Informasi") {
          result.push({ nama, jurusan, keterangan });
          // log di txt
          logger.write(`${nama}|${jurusan}|${keterangan}\n`);
        }
      });
      if (o > tables.length - 2) {
        finish = true;
      }
      o++;
    }

    result = result.map((v, i) => {
      v.no = i + 1;
      return v;
    });

    // log versi JSON
    const log_json = "log.json";
    fs.rmSync(log_json, {
      force: true,
      recursive: true,
    });
    fs.writeFileSync(log_json, JSON.stringify(result, null, 2));

    // END !!
    console.log("Finish...");
  } catch (error) {
    const isAxiosError = error?.response?.data?.message;
    const message = isAxiosError ? error.response.data.message : error.message;
    return {
      code: isAxiosError ? error.response.status : 500,
      message,
    };
  }
})();
