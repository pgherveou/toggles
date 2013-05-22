
build: components index.js index.css
	@echo "var jade = require('jade');\nmodule.exports = " > template.js
	@jade -D -c < template.jade >> template.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
