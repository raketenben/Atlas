const express = require('express')
const path = require('path');
const fs = require('fs');
const app = express()
const port = 1337

app.get('/', function(req, res) {
    res.redirect('/read');
})

app.use('/', express.static(path.join(__dirname, "/dist")));

app.get(['/read/*', '/read'], function(req, res) {
    res.sendFile(path.join(__dirname, "/dist/index.html"));
});

app.get(['/articles', '/articles/*'], function(req, res) {
    //get path
    let dirPath = path.join(__dirname, "/articles", req.params['0'] || "");

    //check filestate
    fs.lstat(dirPath, function(err, stat) {
        if (err)
            return res.status(404).json({ "error": "File not found" });
        if (stat.isFile())
            return res.sendFile(dirPath);
        fs.readdir(dirPath, function(err, files) {
            if (err) return console.error("Error")
            let responseFiles = files.map(function(value) {
                return {
                    isDirectory: fs.lstatSync(path.join(dirPath, value)).isDirectory(),
                    name: value
                };
            });
            res.json(responseFiles);
        })
    })
})
app.post('/articles/*', function(req, res) {
    //get path
    let dirPath = path.join(__dirname, "/articles", req.params['0'] || "");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});