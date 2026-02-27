c:
	rm -f cm-chrome.zip
	zip cm-chrome.zip src/*

f:
	rm -f cm-firefox.zip
	cd src; zip cm-firefox.zip ./*; mv cm-firefox.zip ..
