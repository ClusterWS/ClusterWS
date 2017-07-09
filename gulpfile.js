var gulp = require("gulp");
var ts = require("gulp-typescript");
var jeditor = require("gulp-json-editor");
var exec = require('child_process').exec;
var tsProject = ts.createProject("tsconfig.json");

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest("dist"));
});

gulp.task("clone", function () {
    gulp.src('./README.md')
        .pipe(gulp.dest("dist"));
    return gulp.src('./package.json')
        .pipe(jeditor(function(json) {
            delete json['devDependencies'];
            delete json['scripts'];
            var execCommand = "git tag -a "+ json.version + " -m \"Update version\"";
            exec(execCommand, function(err, stdout, stderr){});
            return json;
        }))
        .pipe(gulp.dest("dist"))
});
