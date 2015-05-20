var Promise = require('bluebird');
var path    = require('path');
var exec    = require('promised-exec');
var nov     = require('../lib/nov');
var colors  = require('../lib/colors');
var ncp     = require('ncp');
var fs      = require('fs');

Promise.promisifyAll(fs);
Promise.promisifyAll(ncp);

/*
 * Copy the blueprint folder, go inside it, and run "npm install"
 */
 
module.exports = function(userArgs) {
  var projectName = userArgs[1];

  if (!projectName) {
    return nov.logErr("You need to specify a name for your project");
  }

  // Check if the folder already exists
  try {
    stats = fs.lstatSync(projectName);
    return nov.logErr("There's already a project with the name " + projectName + " in this directory!");
  }
  catch (e) {
    nov.logInfo("Creating project folder...");

    // Copy the contents of the blueprint folder to the user's app folder 
    ncp.ncpAsync(path.resolve(__dirname, '../template-files/blueprint-project'), projectName)
    .then(function() {
      nov.logInfo("Fixing namespace...");
      return fs.readFileAsync(projectName + '/package.json', 'utf8');
    })
    // Set the name of the app in package.json
    .then(function(packageJsonContents) {
      packageJsonContents = nov.fillTemplatePlaceholders(packageJsonContents, projectName);
      return fs.writeFileAsync(projectName + '/package.json', packageJsonContents, 'utf8');
    })
    .then(function() {
      return fs.readFileAsync(projectName + '/public/index.html', 'utf8');
    })
    // Set the name of the app in index.html
    .then(function(htmlContents) {
      var humanProjectName = projectName.replace(/-/g, ' ');
      htmlContents = nov.fillTemplatePlaceholders(htmlContents, humanProjectName);
      return fs.writeFileAsync(projectName + '/public/index.html', htmlContents, 'utf8');
    })
    // Install NPM dependencies
    .then(function() {
      nov.logInfo("Installing NPM dependencies...");
      process.chdir(projectName); // Go into the created app's directory
      return exec('npm install')
    })
    .then(function() {
      nov.logSuccess("Created " + projectName + " project! Now run `cd " + projectName + "` to get started!");
    })
    .catch(function(err) {
      console.log(err);
      nov.logErr(err);
    });
  }

};
