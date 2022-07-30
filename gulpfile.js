const { src, dest, series, parallel, watch } = require("gulp");
const sass = require("gulp-dart-sass");
const cssnano = require("gulp-cssnano");
const autoprefixer = require("gulp-autoprefixer");
const rename = require("gulp-rename");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const webp = require("gulp-webp");
const sourcemaps = require("gulp-sourcemaps");
const clean = require("gulp-clean");
const kit = require("gulp-kit");
const cache = require("gulp-cached");
const remember = require("gulp-remember");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

const paths = {
    html: "./html/**/*.kit",
    sass: "./src/sass/**/*.scss",
    js: "./src/js/**/*.js",
    img: "./src/assets/**/*",
    dist: "./dist",
    sassDest: "./dist/css",
    jsDest: "./dist/js",
    imgDest: "./dist/assets",
};

function sassCompiler(done) {
    src(paths.sass)
        .pipe(cache("sass"))
        .pipe(sourcemaps.init())
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer())
        .pipe(cssnano())
        .pipe(rename({ suffix: ".min" }))
        .pipe(remember("sass"))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.sassDest));
    done();
}

function javaScript(done) {
    src(paths.js)
        .pipe(cache("js"))
        .pipe(sourcemaps.init())
        .pipe(babel({ presets: ["@babel/env"] }))
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(remember("js"))
        .pipe(sourcemaps.write())
        .pipe(dest(paths.jsDest));
    done();
}

function convertImages(done) {
    src(paths.img)
        .pipe(cache("img"))
        .pipe(webp())
        .pipe(remember("img"))
        .pipe(dest(paths.imgDest));
    done();
}

function handleKits(done) {
    src(paths.html)
        .pipe(cache("kit"))
        .pipe(kit())
        .pipe(remember("kit"))
        .pipe(dest("./"));
    done();
}

function purge(done) {
    src(paths.dist, { read: false }).pipe(clean());
    done();
}

function startBrowserSync(done) {
    browserSync.init({
        server: {
            baseDir: "./",
        },
    });

    done();
}

function watchForChanges(done) {
    watch("./*.html").on("change", reload);
    watch(
        [paths.html, paths.sass, paths.js],
        parallel(handleKits, sassCompiler, javaScript)
    ).on("change", reload);
    watch(paths.img, convertImages).on("change", reload);
    done();
}

const mainFunctions = parallel(
    handleKits,
    sassCompiler,
    javaScript,
    convertImages
);
exports.purge = purge;
exports.default = series(mainFunctions, startBrowserSync, watchForChanges);
