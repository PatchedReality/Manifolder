module.exports = {
  server: true,
  files: ["client/dist/*", "client/css/*", "client/*.html", "lib/**/*"],
  startPath: "client/app.html",
  middleware: [
    function(req, res, next) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    }
  ]
};
