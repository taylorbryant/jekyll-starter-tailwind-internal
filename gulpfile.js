const gulp = require("gulp");
const gutil = require("gulp-util");
const child = require("child_process");
const browserSync = require("browser-sync").create();
const siteRoot = "_site";
const mainCSS = "src/style.css"; /* Main stylesheet (pre-build) */
const tailwindConfig = "tailwind.js"; /* Tailwind config */

/**
 * Compile CSS
 */
gulp.task("css", function() {
  const atimport = require("postcss-import");
  const postcss = require("gulp-postcss");
  const tailwindcss = require("tailwindcss");
  const autoprefixer = require("gulp-autoprefixer");
  const cleancss = require("gulp-clean-css");

  browserSync.notify("Compiling CSS...");

  return gulp
    .src(mainCSS)
    .pipe(postcss([atimport(), tailwindcss(tailwindConfig)]))
    .pipe(autoprefixer({ browsers: ["last 2 versions"], cascade: false }))
    .pipe(cleancss())
    .pipe(gulp.dest("_includes/"));
});

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

/**
 * Custom PurgeCSS Extractor
 * https://github.com/FullHuman/purgecss
 */
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g);
  }
}

/**
 * Run PurgeCSS
 */
gulp.task("purge", ["jekyll-build"], function() {
  const purgecss = require("gulp-purgecss");

  browserSync.notify("Purging CSS...");

  return gulp
    .src("_includes/style.css")
    .pipe(
      purgecss({
        content: ["_site/**/*.html"],
        extractors: [
          {
            extractor: TailwindExtractor,
            extensions: ["html", "js"]
          }
        ]
      })
    )
    .pipe(gulp.dest("_includes/"))
});

/**
 * Serve site with BrowserSync
 */
gulp.task("serve", ["purge"], () => {
  browserSync.init({
    port: 4000,
    open: "local",
    server: {
      baseDir: siteRoot + "/"
    },
    files: [siteRoot + "/**"]
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
    { interval: 1000 },
    ["purge"]
  );
});

gulp.task("default", ["serve"]);
