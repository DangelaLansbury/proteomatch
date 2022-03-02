const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let proteins = [];
let query;

app.get("/", function(req, res){
    res.render("home", {introduction: "Find proteins by biological process or molecular function"});
});

app.get("/results", function(req, res){
    res.render("results", {keyword: query, allProteins: proteins});
});

app.post("/", function(req, res){
    proteins = [];
    query = req.body.proteoSearch;
    let url = "https://rest.uniprot.org/beta/uniprotkb/search?format=json&query=keyword:" + query + "&fields=organism_name,protein_name,keyword";
    https.get(url, function(response){
        const dataArray = [];
        response.on("data", function(data){
            dataArray.push(data);
        });
        response.on("end", function(){
            const data = Buffer.concat(dataArray);
            let proteinsData = JSON.parse(data);
            for (let i = 0; i < proteinsData.results.length; i++){
                const protein = {
                    id: proteinsData.results[i].primaryAccession,
                    name: _.truncate(proteinsData.results[i].proteinDescription.recommendedName.fullName.value, {
                        'length': 80,
                        'omission': ' ...'
                    }),
                    taxonID: proteinsData.results[i].organism.taxonId,
                    organism: _.truncate(proteinsData.results[i].organism.scientificName, {
                        'length': 70,
                        'omission': ' ...'
                    })
                };
                proteins.push(protein)
            };
            if (proteins.length === 0){
                res.render("home", {introduction: "Whoops, that phrase doesn't seem to match any keywords. Try searching for something like 'mRNA transport' or 'endorphin'"});
            } else {
                res.redirect("/results");
            };
        });
    });
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server is running on port 3000.");
});
