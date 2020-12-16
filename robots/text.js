const algorithmia = require("algorithmia");
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey;
const sentenceBoundaryDetection = require("sbd");

async function robot(content) {
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentIntoSentences(content);

    async function fetchContentFromWikipedia(content) {
        const algorithmiaAuthentication = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAuthentication.algo("web/WikipediaParser/0.1.2");
        try {
            const wikipediaResponse = await wikipediaAlgorithm.pipe(content.searchTerm);
            const wikipediaContent = wikipediaResponse.get();
            content.sourceContentOriginal = wikipediaContent.content;
        } catch (error) {
            console.log(error);
        }
    }

    function sanitizeContent(content){
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown);
        content.sourceContentSenitized = withoutDatesInParentheses;

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n');
            
            const withoutBlankLinesAndMarkdown = allLines.filter(line => { 
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false;
                }
                return true;
            });
            return withoutBlankLinesAndMarkdown.join(' ');
        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ');
        }
    }

    function breakContentIntoSentences(content) {
        content.sentences = [];
        
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSenitized);
        sentences.forEach(sentence => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            });
        });
    }
}

module.exports = robot;