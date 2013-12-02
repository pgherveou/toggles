
build: components index.js index.css
	@component build --dev
	@cp build/* demo

components: component.json
	@component install --dev

clean:
	rm -fr build components

.PHONY: clean
