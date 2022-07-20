const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");

// Validataion for empty request body
const isValidObject = function (value) {
  if (Object.keys(value).length === 0) return false;
  else return true;
};

// Validation for Strings/ Empty strings
const hasEmptyString = function (value) {
  if (typeof value !== "string") return false;
  else if (value.trim().length == 0) return false;
  else return true;
};
const createShortUrl = async function (req, res) {
  try {
    let urlCode = shortid.generate();
    const baseUrl = "http://localhost:3000/";
    const shortUrl = baseUrl.concat(urlCode);
    let data = req.body;
    let longUrl = data.longUrl;
    data.urlCode = urlCode;
    data.shortUrl = shortUrl;

    if (!isValidObject(data)) {
      return res
        .status(400)
        .send({ status: false, message: "Missing Parameters" });
    }
    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is mandatory" });
    } else if (!hasEmptyString(longUrl)) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is in wrong format" });
    }

    let found = false; // Using axios to check for correct longurl
    await axios
      .get(longUrl)
      .then((response) => {
        if (response.status == 200 || response.status == 201) found = true;
      })
      .catch((error) => {});

    if (found == false) {
      return res.status(400).send({ status: false, message: "Wrong url" });
    }

    const existUrlCode = await urlModel.findOne({ urlCode: urlCode });
    if (existUrlCode) {
      return res
        .status(400)
        .send({ status: false, message: `${urlCode} is already exists` });
    }
    const existShortUrl = await urlModel.findOne({ shortUrl: shortUrl });
    if (existShortUrl) {
      return res
        .status(400)
        .send({ status: false, message: `${shortUrl} is already exists` });
    }
    const existLongUrl = await urlModel.findOne({ longUrl: longUrl });
    if (existLongUrl) {
      return res.status(400).send({
        status: false,
        message: `${longUrl} is already exists so we can't generate urlcode with same url`,
      });
    }
    await urlModel.create(data);
    const NewUrlDetails = {
      longUrl: longUrl,
      shortUrl: shortUrl,
      urlCode: urlCode,
    };
    return res.status(201).send({ status: true, data: NewUrlDetails });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;
   
    const originalUrl = await urlModel
      .findOne({ urlCode: urlCode })
      console.log(originalUrl)

    if (originalUrl) {
      res.redirect(originalUrl.longUrl);
    }
    if (!originalUrl) {
      return res.status(400).send({
        status: false,
        message: "Url not found",
      });
    }
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports = { createShortUrl, getUrl };
