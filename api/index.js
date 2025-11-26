import Home from "../app/pages/index.js";

export default function handler(req, res) {
  const html = Home();
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
}
