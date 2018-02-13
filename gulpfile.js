const gulp = require("gulp");
const gutil = require("gulp-util");
const child = require("child_process");
const browserSync = require("browser-sync").create();
const siteRoot = "_site";
const mainCSS = "src/style.css"; /* Main stylesheet (pre-build) */
const tailwindConfig = "tailwind.js"; /* Tailwind config */

/**
 * Fix Windows compatibility issue
 */
const jekyll = process.platform === "win32" ? "jekyll.bat" : "jekyll";

/**
 * Build Jekyll site
 */
gulp.task("jekyll-build", ["css"], function() {
  browserSync.notify("Building Jekyll site...");
  return child.spawn(jekyll, ["build"], { stdio: "inherit" });
});

gulp.task("css", function() {
  const atimport = require("postcss-import");
  const postcss = require("gulp-postcss");
  const tailwindcss = require("tailwindcss");
  const autoprefixer = require("gulp-autoprefixer");
  const cleancss = require("gulp-clean-css");

  return gulp
    .src(mainCSS)
    .pipe(postcss([atimport(), tailwindcss(tailwindConfig)]))
    .pipe(
      autoprefixer({
        browsers: ["last 2 versions"],
        cascade: false
      })
    )
    .pipe(cleancss())
    .pipe(gulp.dest("_includes/"));
});

/**
 * Serve site with Browsersync
 */
gulp.task("serve", ["jekyll-build"], () => {
  browserSync.init({
    files: [siteRoot + "/**"],
    open: "local",
    port: 4000,
    server: {
      baseDir: siteRoot
    }
  });

  gulp.watch(
    [
      mainCSS,
      tailwindConfig,
      "**/*.html",
      "**/*.md",
      "**/*.yml",
      "!_site/**/*",
      "!node_modules"
    ],
    { interval: 500 },
    ["jekyll-build"]
  );
});

gulp.task("default", ["serve"]);
