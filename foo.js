if (localStorage.getItem('systemprompt') == null) {
    localStorage.setItem('systemprompt', `Given the following preferences, mark Tweets as either PASS or FILTER, where filtered Tweets will be removed from the user's feed.\n\nPreferences:\n- like: big news about physics\n- dislike: non-substantive content, opinions/questions\n- like: posts sharing ai research papers\n- dislike: nearly anything cryptocurrency related, unless it's particularly interesting from a mathematics or cryptography perspective\n- err on the side of passing posts that don't have enough context\n- filter posts that are social in essence, about someone's personal life\n- in general, if you don't learn anything new about actual things in the world from a tweet, it should be filtered. For example, "this is going to be the most chaotic decade in human history" doesn't actually contain any substative information.\n- No rhetorical question tweets.\n- no promotional tweets\n- nothing that seems like a clickbaity list, i.e. "THESE 5 SIMPLE TRICKS WILL MAKE YOU LITTERALLY MAGIC"`);
}

system_prompt = localStorage.getItem('systemprompt');



multishot_prompt = [
    {
        "role": "user",
        "content": "François Chollet\n@fchollet\n·\n6h\nSo, is the jury out yet on room-temperature superconductors?"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "Crypto Valley Journal (English)\n@CVJournal_ch_EN\nFounded as a fun cryptocurrency, now spurned by its creator, #Dogecoin is getting some special attention in 2021. The Dogecoin Foundation's recently released manifesto is up to big things. An overview.\n\n$DOGE\n\nhttps://cvj.li/xbF8C"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "Gabriel\n@gbrl_dick\n·\nJul 31\noh you're waiting for a replication? that's cool, that's cool. you want to see the MIT announcement. i get it. no point getting on the 'hype train', right? \n\ni'm watching soviet hedge chemists optimise the copper lattice synthesis step using a blowtorch and kitchen hardware"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "Dave Richeson\n@divbyzero\n·\nJul 31\nAll of the plenary talks were amazing at Bridges this year! \n@mathgrrl\n gave the last one, and during the talk she gave everyone a 3D printed copy of this knot, which has the surprising property there does not exist a plane that is tangent to the knot in three places. So it rolls!"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "Elon Musk\n\n@elonmusk\n·\n23h\nBlaze Your Glory!!\n"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nEmad\n@EMostaque\n·\n2h\nHave any tools for thought integrated GPT-4 support yet?\n"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nJoscha Bach\n@Plinz\n·\n19h\nI will leave twitter/X when another platform gives me a timeline based on my own choice of algorithm, an unconditional edit button and the ability to delete individual replies.\n"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "Soumith Chintala\n@soumithchintala\n·\nJul 30\nNo More GIL!\nthe Python team has officially accepted the proposal.\n\nCongrats \n@colesbury\n on his multi-year brilliant effort to remove the GIL, and a heartfelt thanks to the Python Steering Council and Core team for a thoughtful plan to make this a reality.\n"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "okay this paper is wild\ntransformers *can* be taught arithmetic.\nsimply reversing the format in which you present the answer, improves accuracy to 100% in ~5k steps (compared to non-convergence by 100k steps).\nthis had been demonstrated previously in LSTMs\nhttps://arxiv.org/abs/2307.03381"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nPhysics In History\n@PhysInHistory\n·\n15h\nMathematician Paul Erdős used to work for nearly 19 hours a day doing math and often claimed that he requires only three hours of sleep. He published nearly 1500 papers on mathematics and co-authored with more than 250 mathematicians during his time. Erdös is credited for…Show more\n"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "Noah Smith 🐇🇺🇸🇺🇦\n@Noahpinion\n·\n4h\nWhy did Russia produce so much high-quality cultural output in the 19th century, but so little in the post-Soviet period?"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nMichael Patrón\n@michaelpatron0\n·\n16h\nHad to fire 2 ppl today.  These were employees with 2+ years of tenure.  They were remote and clocking in and using software to mimic work but not actually working - prob hundreds of hours of this.  I liked these people and they were well liked within the company - Even though..."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "Ryan McEntush\n@rmcentush\n·\nJul 31\nfor everyone saying this is biased towards engineering, I’m sorry to break it to you that the universe is also biased towards engineering\nQuote Tweet\nRyan McEntush\n@rmcentush\n·\nJul 31\nnot all majors are created equal"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "𝔊𝔯𝔦𝔪𝔢𝔰\n@Grimezsz\n·\nJul 31\nMuch love to i_o who I made this song with, and to his family too.  Im so glad his music continues to resonate with people.  Achieving immortality thru art.  I still listen to his songs with \n@lights\n probably once a week 💜\nQuote Tweet\nGrimes Data\n@GrimesSpotify\n·\nJul 30\n‘Violence’ has surpassed 50 MILLION streams. It is Grimes’ sixth song to reach this milestone and the first from ‘Miss Anthropocene’."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\n𝔊𝔯𝔦𝔪𝔢𝔰\n@Grimezsz\n·\nJul 31\nMuch love to i_o who I made this song with, and to his family too.  Im so glad his music continues to resonate with people.  Achieving immortality thru art.  I still listen to his songs with \n@lights\n probably once a week 💜\nQuote Tweet\nGrimes Data\n@GrimesSpotify\n·\nJul 30\n‘Violence’ has surpassed 50 MILLION streams. It is Grimes’ sixth song to reach this milestone and the first from ‘Miss Anthropocene’.\nKernel\n@KernelCo\n·\n9h\n🚀🧠 Introducing Flow2: A Revolutionary Breakthrough in Neuroimaging!\n\nFlow2 offers fMRI-like functional neuroimaging through TD-fNIRS + EEG integration. Portable & built to scale - let's unlock the potential of precision neuromedicine together! \n"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nTheo - t3.gg\n@t3dotgg\n·\n11h\nDuring my Amazon internship, I got Linux and i3 pilled really hard.\n\n2 years later at my first real job, my manager used a Mac with all apps full screen. Just CMD+tab’d through it all. Fastest dev I’d ever seen.\n\nSince then, I dropped all the fancy shit. I’m much faster now\nQuote Tweet\nnexxel\n@nexxeln\n·\n14h\ni don't need any fancy window managers. i'll cmd + tab everything"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nMarkov\n@MarkovMagnifico\n·\n2h\nman: thank you God for giving us computers to do the hard thinking for us\n\ngod: of course my child, this is what I always intended. that’s why I made them so easy to make with just lead and copper\n\nman: …you mean silicon right?\n\ngod: oh no… please, don’t tell me…"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "@goth\n\n@goth600\n·\n19h\nYour great-great-grandparents got psyoped by a radio, and here you are."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "Matt Binder\n@MattBinder\n·\nJul 31\nX / Twitter won't let city building inspectors check out the giant X logo on the roof of their HQ\n\ninspectors have been denied access for the past two days upon visiting to inspect the structure"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\ngfodor.id\n@gfodor\n·\n2h\nI know we aren't at 100% yet but has anyone else mentioned that we can build the solar array in the Sahara to power the whole planet now if it works"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nJoscha Bach\n@Plinz\n·\n22h\nI think it's legitimate if a government wants to scan all private messages of the public to prevent child pornography and terrorism, but the public must also scan all private messages of that government to ensure that it is only preventing child pornography and terrorism."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nmadeline odent\n@oldenoughtosay\n·\n21h\nA couple years ago I read an article that claimed that cross-cultural relationships are likelier to fail on account of irreconcilable differences, and I thought that was ridiculous, but we’ve just spent an hour arguing over which version of a nursery rhyme we’ll teach our son"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nAnthropic\n@AnthropicAI\n·\n10h\nCongratulations to everyone who took part in our #BuildwithClaude hackathon over the weekend!\n\nWe’re so inspired by all of the passionate hackers and their innovative solutions.\n\nLet’s take a look at the winners:"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nRishi Sunak\n@RishiSunak\n·\n13h\nLabour’s energy policy might as well have been written by Just Stop Oil.\n\nThey're even funded by the same person.\n\nAnd their policies would threaten both our energy security and jobs here in the UK.\n\nToday I took action to stop that from happening 👇🧵"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nPaul Graham\n@paulg\n·\n18h\nA couple times a day I check the prediction market on LK-99. It has doubled since its low on July 29. Still only 24%, but it's moving up, not down."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nEthan Mollick\n@emollick\n·\nJul 31\n·\n👀I hear folks say “AI can’t be creative” but…\n\nChatGPT-4 generated more, cheaper & better ideas than folks in an innovation class. “More important, the vast majority of the best ideas in the pooled sample are generated by ChatGPT and not by the students” https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4526071"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "@jason\n\n@Jason\n·\n16h\nTikTok is destroying a generation's essential brain function. \n\nIt's poison. \n\nDon't let your kids near it."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\n@goth\n\n@goth600\n·\n5h\nForget everything you know. Here’s why AI matters."
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nEliezer Yudkowsky\n@ESYudkowsky\n·\n1h\nI don't think LK99 is useful for power cables unless there's a variant with much higher current capacity.\n\nWhat we maybe can do - if I'm not missing anything - is finally build the Monopole Detector, and we wouldn't even need to go to Antarctica for it!"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nroon\n@tszzl\n·\n29m\nim wired in. im downloading the global scientific micromovements of knowledge as we speak. im watching the prediction markets real time predict the nature of the universe. im arguing with bots in my replies powered by full blown artificial minds"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nNoah Smith 🐇🇺🇸🇺🇦\n@Noahpinion\n·\n9h\nFour facts:\n\n1. U.S. total carbon emissions were at the same level in 2021 as in 1979. \n\n2. Per capita emissions were at the same level as 1912.\n\n3. Outsourcing of U.S. emissions to other countries is very small. \n\n4. U.S. emissions are less than half of China's."
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\n👩‍💻 Paige Bailey\n@DynamicWebPaige\n·\nJul 31\n\"We propose LEVER, a simple approach to improve language-to-code generation by learning to verify the generated programs with their execution results.\n\nSpecifically, we train verifiers to determine whether a program sampled from the LLMs is correct or not based on the natural…Show more"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nAK\n@_akhaliq\n·\nJul 31\nOpen Problems and Fundamental Limitations of Reinforcement Learning from Human Feedback\n\npaper page: https://huggingface.co/papers/2307.15217\n\nReinforcement learning from human feedback (RLHF) is a technique for training AI systems to align with human goals. RLHF has emerged as the central method… Show more"
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nNerbts\n@Nerbts\n·\nJul 31\nPrompt Share: Exploded view Diagram\n\nGm! Here's a fun prompt to start the week.\n\nPrompt: Exploded view diagram of [Subject]\nTip: Add your favourite [Style] to prompt to mix it up.\n[Style] Exploded view diagram of [Subject]\n\n#midjourney#Promptshare#aiartcommunity"
    },
    {
        "role": "assistant",
        "content": "FILTER"
    },
    {
        "role": "user",
        "content": "\nAlex Kaplan\n@alexkaplan0\n·\n2h\nIncredibly, a similar paper was published to the arXiv on the 29th from the Shenyang National Laboratory for Materials Science! \n\n\"The existence of these peculiar flat bands may be connected with the experimentally observed remarkable superconducting properties of LK-99.\""
    },
    {
        "role": "assistant",
        "content": "PASS"
    },
    {
        "role": "user",
        "content": "\nStephen Wolfram\n@stephen_wolfram\n·\n10h\nInspired by a book cover in 1972 ... half a century later I think I finally understand the Second Law ... and today published my own book about it.\nhttps://amazon.com/Second-Law-Resolving-Mystery-Thermodynamics/dp/1579550835"
    },
    {
        "role": "assistant",
        "content": "PASS"
    }
]

function gpt_filter(element) {
    post_text = element.innerText.split('\n').slice(0, -4).join('\n');
    if (texts.includes(post_text)) {
        return;
    }
    element.style.backgroundColor = '#4B4901';
    response = fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer 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`
        },
        body: JSON.stringify({
            'model': 'gpt-3.5-turbo',
            'messages': [{"role": "system", "content": system_prompt}].concat(multishot_prompt.concat([{'role': 'user', 'content': post_text}])),
            'temperature': 0.7
        })
    }).then(response => response.json()).then(
        data => {
            if (data.choices[0].message.content == 'FILTER') {
                console.log('filtered')
                element.style.backgroundColor = '#660000';
                element.style.height = '5px';
                texts.push(post_text);
            } else {
                console.log('passed')
                element.style.backgroundColor = '#00354B';
                texts.push(post_text);
            }
        }
        ).catch((error) => {
    console.error('Error:', error);
    gpt_filter(element);
    });
}



let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                let articles = node.querySelectorAll('[role="article"]');
                if (node.getAttribute('role') === 'article') {
                    articles = [node, ...articles];
                }

                articles.forEach((article) => {
                    gpt_filter(article);
                });
            }
        });
    });
});

let config = {
    attributes: false,
    childList: true,
    subtree: true,  // Will watch all descendants of the target
};

let targetNode = document.querySelector('body');

observer.observe(targetNode, config);

function checkall() {
    texts = []
    document.querySelectorAll('[role="article"]').forEach((article) => {
        article.style.backgroundColor = '';
        gpt_filter(article);
    });
}

function feedback(newpref) {
    system_prompt += '\n- ' + newpref;
    localStorage.setItem('systemprompt', system_prompt);
    checkall();
}

function start() {
    let input = document.createElement("input");
    input.style.position = 'fixed';
    input.style.bottom = '0px';
    input.style.right = '0px';
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            feedback(this.value);
            this.value = '';
        }
    });
    document.body.appendChild(input);

    checkall();
}

start();

// let elements = document.querySelectorAll('[role="menuitem"]');
// for(let i = 0; i < elements.length; i++) {
//   if(elements[i].innerText.includes("Not interested in this post")) {
//     elements[i].style.backgroundColor = 'red';
//   }
// }

// document.querySelectorAll('[role="article"]')[11].querySelector('[data-testid="caret"]').click()
