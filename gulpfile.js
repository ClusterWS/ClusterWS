var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task("default", function () {
    return tsProject.src()
        .pipe(tsProject())
        .pipe(gulp.dest("dist"));
});

gulp.task("clone", function(){
   return gulp.src('./template.json')
       .pipe(rename('package.json'))
       .pipe(gulp.dest("dist"))
});
