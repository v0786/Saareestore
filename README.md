# Saaree Store · The Silk Edit

An interactive silk saree showroom with a six-mood archive, eight styled looks, a colour-card collection, a filterable clothes rail, a digital lookbook film, five reels, a bridal edit and a three-silk comparison.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 from the browser. The site uses plain HTML, CSS and JavaScript and can be served from any static host.

## Catalog and media

`catalog.js` contains the sample products, INR prices, tags and offers. `assets/` contains original AI-generated showroom, model and product imagery, including separate illustrative front and back views. The Muse film and reels animate this imagery and use an original synthesized audio bed.

The wishlist and shopping bag persist in the visitor's browser. The catalog, availability messaging and shopping interactions are a showroom demo. There is no order processing, payment gateway, stock service or store locator.

## Visual references

The [Noolam showcase](https://github.com/alagappan567/noolam-saree-showcase/tree/bb33425) supplied ten screenshots, nine section prompts and its process notes. The showroom video also informed the weave comparison section. This implementation uses its own source and visual assets.
