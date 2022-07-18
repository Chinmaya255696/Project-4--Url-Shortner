const urlModel = require("../models/urlModel");
const validUrl = require("valid-url");
const shortid = require("shortid");
const axios = require("axios");

const createShortUrl = async function (req, res) {
  try {
    let urlCode = shortid.generate();
    const baseUrl = "http://localhost:3000/";
    const shortUrl = baseUrl.concat(urlCode);
    let data = req.body;
    let longUrl = data.longUrl;
    data.urlCode = urlCode;
    data.shortUrl = shortUrl;

    let found = false; // Using axios to check for correct Logolink with content type image
    await axios
      .get(longUrl)
      .then((response) => {
        if (response.status == 200 || response.status == 201) {
          if (response.headers["content-type"]) found = true;
        }
      })
      .catch((error) => {});

    if (found == false) {
      return res.status(400).send({ status: false, message: "wrong url" });
    }

    const validUrlCode = await urlModel.findOne({ urlCode: urlCode });
    if (validUrlCode) {
      return res
        .status(400)
        .send({ status: false, message: `${urlCode} is already exists` });
    }
    const validShortUrl = await urlModel.findOne({ shortUrl: shortUrl });
    if (validShortUrl) {
      return res
        .status(400)
        .send({ status: false, message: `${shortUrl} is already exists` });
    }
    const validLongUrl = await urlModel.findOne({ longUrl: longUrl });
    if (validLongUrl) {
      return res.status(400).send({
        status: false,
        message: `${longUrl} is already exists so we can't generate urlcode`,
      });
    }
    const urlDetails = await urlModel.create(data);
    return res.status(201).send({ status: true, data: urlDetails });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;
    const originalUrl = await urlModel
      .findOne({ urlCode: urlCode })
      .select({ longUrl: 1, _id: 0 });

    if (originalUrl) {
       res.status(302).send({
        status: true,
        message: `Redirection to ${originalUrl.longUrl}`,
      });
      return res.redirect(302, originalUrl.longUrl);
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createShortUrl, getUrl };
