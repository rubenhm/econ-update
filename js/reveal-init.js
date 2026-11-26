// Full list of configuration options available at:
// https://github.com/hakimel/reveal.js#configuration
Reveal.initialize({
    controls: true,
    progress: true,
    history: false,
    center: false,
    slideNumber: 'c/t', // Display the page number of the current slide

    transition: 'convex', // none/fade/slide/convex/concave/zoom

    // The "normal" size of the presentation, aspect ratio will be preserved
    // when the presentation is scaled to fit different resolutions. Can be
    // specified using percentage units.
    width: 1000,
    height: 750,

    // Factor of the display size that should remain empty around the content
    margin: 0.05,

    // Bounds for smallest/largest possible scale to apply to content
    minScale: 0.2,
    maxScale: 1.5,

    // Options which are passed into marked
    // See https://github.com/chjj/marked#options-1
    markdown: {
        smartypants: true
    },


    // Optional reveal.js plugins
    dependencies: [
        { src: 'lib/js/classList.js', condition: function() { return !document.body.classList; } },
        { src: 'plugin/zoom-js/zoom.js', async: true },
        { src: 'plugin/notes/notes.js', async: true },
        { src: 'plugin/highlight/highlight.js', async: true,
            callback: function() { hljs.initHighlightingOnLoad(); } },
        { src: 'plugin/markdown/marked.js',
            condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/markdown/markdown.js',
            condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
        { src: 'plugin/gamepad/gamepad.js', async: true }, //Gamepad
    ]
});
