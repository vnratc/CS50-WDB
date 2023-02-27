document.addEventListener('DOMContentLoaded', function () {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // By default, load the inbox
    load_mailbox('inbox');
    
    // Send Mail

    // By default "Send" button is disabled
    document.querySelector('#send').disabled = true;
    // Enable "Send" button if body inpyt is filled
    document.querySelector('#compose-body').onkeyup = () => {
        if (document.querySelector('#compose-body').value.length > 0) {
            document.querySelector('#send').disabled = false;
        } else {
            document.querySelector('#send').disabled = true;
        }
    }
    // On form submit
    document.querySelector('#compose-form').onsubmit = async function() {    
        await fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({  // This "body" object is used in "compose" view to extract forms' values.
                recipients: document.querySelector('#compose-recipients').value,
                subject: document.querySelector('#compose-subject').value,
                body: document.querySelector('#compose-body').value

            })
        })
        document.querySelector('#send').disabled = true
    }
});

function compose_email() {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#view-email').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

async function load_mailbox(mailbox) {

    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-email').style.display = 'none';
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    // Remove previously created elements
    let elements = document.querySelectorAll("#view-email > *")
    for (let element of elements) {
        element.remove()
    }

    // Mailbox

    await fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
        for (email of emails) {
            let div = document.createElement('div');
            div.classList.add('email-item')
            if (email.read === true) {
                div.classList.add('read')
            } else {
                div.classList.add('unread')
            }
            // Store email.id in a dataset of this div
            div.dataset.id = email.id;
            div.innerHTML = `From: ${email.sender}. Subject: ${email.subject}. Date & Time: ${email.timestamp}.`
            document.querySelector('#emails-view').append(div)
        }

        // View Email

        document.querySelectorAll('.email-item').forEach(email_item => {
            email_item.onclick = async function() {
                document.querySelector('#emails-view').style.display = 'none';
                document.querySelector('#view-email').style.display = 'block';
                await fetch('emails/' + email_item.dataset.id)
                .then(response => response.json())
                .then(email => {
                    // Create 5 divs
                    for (let i = 0; i < 5; i++) {
                        let new_div = document.createElement('div')
                        new_div.setAttribute('id', 'div' + i)
                        new_div.classList.add('email-content')
                        document.querySelector('#view-email').append(new_div)
                    }
                    // Populate divs with data
                    document.querySelector('#div0').innerHTML = `From: ${email.sender}`
                    document.querySelector('#div1').innerHTML = `Recipients: ${email.recipients}`
                    document.querySelector('#div2').innerHTML = `Subject: ${email.subject}`
                    document.querySelector('#div3').innerHTML = `Date & Time: ${email.timestamp}`
                    document.querySelector('#div4').innerHTML = `${email.body}`

                    // Archive and Unarchive

                    if (mailbox !== 'sent') {
                        let button = document.createElement('button')
                        button.dataset.id = email.id
                        document.querySelector('#view-email').append(button)
                        button.classList.add('btn', 'btn-secondary')
                        // Archive
                        if (mailbox === 'inbox') {
                            button.innerHTML = 'Archive'
                            button.onclick = async () => {
                                await fetch('/emails/' + button.dataset.id, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                        archived: true
                                    })
                                })
                                load_mailbox('inbox')
                            }                            
                        }

                        // Unarchive
                        else if (mailbox === 'archive') {
                            button.innerHTML = 'Unarchive'
                            button.onclick = async () => {
                                await fetch('/emails/' + button.dataset.id, {
                                    method: 'PUT',
                                    body: JSON.stringify({
                                        archived: false
                                    })
                                })
                                load_mailbox('inbox')
                            }
                        }
                    }

                    // Reply

                    let button_reply = document.createElement('button')
                    button_reply.classList.add('btn', 'btn-primary')
                    button_reply.innerHTML = 'Reply'
                    document.querySelector('#view-email').append(button_reply)
                    button_reply.onclick = () => {
                        // Show compose view and hide other views
                        document.querySelector('#emails-view').style.display = 'none';
                        document.querySelector('#compose-view').style.display = 'block';
                        document.querySelector('#view-email').style.display = 'none';

                        // Clear out composition fields
                        document.querySelector('#compose-recipients').value = email.sender;
                        console.log(email.subject.slice(0, 4))
                        if (email.subject.slice(0, 4) !== 'Re: ') {
                            document.querySelector('#compose-subject').value = `Re: ${email.subject}`
                        } else {
                            document.querySelector('#compose-subject').value = email.subject
                        }
                        document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`;
                    }
                })
                // Mark as "read"
                await fetch('emails/' + email_item.dataset.id, {
                    method: 'PUT',
                    body: JSON.stringify({
                        read: true
                    })
                })
            }
        })
    })

}

