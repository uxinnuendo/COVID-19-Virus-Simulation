var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function(){
	return gulp.src('src/sass/app.scss')
		.pipe(sass({outputStyle: 'compressed'}))
		.pipe(gulp.dest('dist/css'))
});

gulp.task('watch', function(){
  gulp.watch('src/sass/**/*.scss', gulp.series['sass']);
})
