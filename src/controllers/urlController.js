const urlModel = require("../models/urlModel");
const shortid = require("shortid");
const axios = require("axios");

// Validataion for empty request body
const checkBodyParams = function (value) {
  if (Object.keys(value).length === 0) return false;
  else return true;
};

// Validation for Strings/ Empty strings
const isEmpty = function (value) {
  if (typeof value !== "string") return false;
  else if (value.trim().length == 0) return false;
  else return true;
};

//......................................... Create Short Url ......................................//
const createShortUrl = async function (req, res) {
  try {
    let data = req.body;
    if (!checkBodyParams(data)) {
      return res
        .status(400)
        .send({ status: false, message: "Missing Parameters" });
    }
    let longUrl = data.longUrl;
    const baseUrl = "http://localhost:3000/";

    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, message: "Long url is mandatory" });
    } else if (!isEmpty(longUrl)) {
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

    const isLongUrlExists = await urlModel
      .findOne({ longUrl: longUrl })
      .select({ urlCode: 1, longUrl: 1, shortUrl: 1, _id: 0 });

    if (isLongUrlExists) {
      return res.status(200).send({
        status: true,
        message: "Short url is already generated",
        data: isLongUrlExists,
      });
    }
    const urlCode = shortid.generate();
    const shortUrl = baseUrl.concat(urlCode);
    data.urlCode = urlCode;
    data.shortUrl = shortUrl;

    await urlModel.create(data);
    return res
      .status(201)
      .send({ status: true, data: { longUrl, shortUrl, urlCode } });
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message });
  }
};

//.........................................Get Url ......................................//
const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;

    if (!shortid.isValid(urlCode)) {
      //checks for space and special character or length less than 7
      return res.status(400).send({
        status: false,
        message: "Invalid url code",
      });
    }
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
