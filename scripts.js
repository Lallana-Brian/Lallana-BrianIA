// URL del repositorio web-llm
import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm"

const $ = el => document.querySelector(el)

// pongo delante de la variable un simbolo de $
// para indicar que es un elemento del DOM
const $form = $('form')
const $input = $('input')
const $template = $('#message-template')
const $messages = $('ul')
const $container = $('main')
const $button = $('button')
const $info = $('small')

let messages = []

// Cargar el web worker
if (window.Worker) {
    const worker = new Worker('worker.js')
    worker.postMessage('hello worker')
}

// ID del modelo de la ia
const SELECTED_MODEL = 'Llama-3.2-3B-Instruct-q4f32_1-MLC'
// motor ia
const engine = await CreateMLCEngine(
    SELECTED_MODEL,  // podriamos poner temperatura y demás
    {
        initProgressCallback: (info) => {
            console.log('initProgressCallback', info)
            $info.textContent = '${info.text}%'
            if (info.progress === 1) {
                $button.removeAttribute('disabled')
            }
        }
    }
)

$form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const messageText = $input.value.trim()

    if (messageText !== '') {
        // añadimos el mensaje en el DOM
        $input.value = ''
    }

    addMessage(messageText, 'user')
    $button.setAttribute('disabled','') 

    const userMessage = {
        role: 'user',
        content: messageText
    }

    messages.push(userMessage)

    // mientras va generando la respuesta la va devolviendo y no se queda esperando para darme la respuesta todo de una
    const chunks = await engine.chat.completions.create({
        messages,
        stream: true   
    })

    let reply = ""

    const $botMessage = addMessage("", 'bot')

    for await (const chunk of chunks) {
        const choice = chunk.choices[0]
        const content = choice?.delta?.content ?? ""
        reply += content
        $botMessage.textContent = reply


        console.log(chunk.choices)
    }
    
    $button.removeAttribute('disabled')
    // const botMessage = reply.choices[0].message
    messages.push({
        role: 'assistant',
        content: reply
    })
    // addMessage(botMessage.content, 'bot')
    $container.scrollTop = $container.scrollHeight
})


function addMessage(text, sender) {
    // clonar el template
    const clonedTemplate = $template.content.cloneNode(true)
    const $newMessage = clonedTemplate.querySelector('.message')

    const $who = $newMessage.querySelector('span')
    const $text = $newMessage.querySelector('p')

    $text.textContent = text
    $who.textContent = sender === 'bot' ? 'GPT' : 'Tú'
    $newMessage.classList.add(sender)

    // scroll para los mensajes
    $messages.appendChild($newMessage)

    $container.scrollTop = $container.scrollHeight

    return $text

}