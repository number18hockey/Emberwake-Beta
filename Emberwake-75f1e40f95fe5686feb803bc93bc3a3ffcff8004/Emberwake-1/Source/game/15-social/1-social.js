// ---------------- Emberwake Social ----------------
const SOCIAL = { token: '', user: null, state: null, open: false, chatUser: '', lastMessage: 0, busy: false, polling: false };

function socialBuildPanel() {
  if (document.getElementById('socialOverlay')) return;
  const style = document.createElement('style');
  style.textContent = `
    #socialOverlay{display:none;position:fixed;inset:0;z-index:5;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,13,.82);font:14px/1.4 system-ui,sans-serif;color:#e8edf2}
    #socialOverlay.open{display:flex}
    #socialCard{display:flex;flex-direction:column;width:min(900px,100%);height:min(660px,100%);background:#16121f;border:1px solid #4a4460;border-top:3px solid #7ddc6f;border-radius:8px;box-shadow:0 12px 50px #000b;overflow:hidden}
    #socialHeader{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #3d3a52}
    #socialHeader h2{flex:1;margin:0;color:#7ddc6f;font:700 18px Menlo,Consolas,monospace;letter-spacing:2px}
    #socialContent{display:flex;flex:1;min-height:0}
    #socialAuth{width:min(360px,100%);margin:auto;padding:20px}
    #socialAuth h3{margin:0 0 6px;color:#ffd35a}
    #socialAuth p,#socialNote{color:#b9bdd0}
    #socialMain{display:none;flex:1;min-height:0}
    #socialSide{width:280px;min-width:220px;display:flex;flex-direction:column;gap:12px;padding:12px;border-right:1px solid #3d3a52;overflow:auto}
    #socialChat{display:flex;flex:1;min-width:0;flex-direction:column;padding:12px}
    .socialSection{border:1px solid #3d3a52;border-radius:6px;padding:8px}
    .socialSection h3{margin:0 0 7px;color:#ffd35a;font:700 12px Menlo,Consolas,monospace;letter-spacing:1px}
    .socialRow{display:flex;align-items:center;gap:6px;margin:5px 0}
    .socialRow button:first-child{flex:1;text-align:left}
    .socialRow small{display:block;color:#8b8fa3}
    .socialForm{display:flex;gap:6px;margin-top:8px}
    .socialForm input{min-width:0;flex:1}
    .socialInput{width:100%;margin:5px 0 10px}
    #socialMessages{flex:1;min-height:120px;overflow:auto;padding:6px;background:#100d17;border:1px solid #3d3a52;border-radius:6px}
    .socialMessage{margin:5px 0;padding:6px 8px;border-radius:6px;background:#211b2c;overflow-wrap:anywhere}
    .socialMessage.mine{background:#1c302c}
    .socialMessage strong{color:#ffd35a}
    .socialMessage p{margin:2px 0 0;white-space:pre-wrap}
    #socialChatControls{display:flex;gap:6px;margin-top:8px}
    #socialChatControls input[type=text]{flex:1;min-width:0}
    #socialGiftControls{display:flex;gap:6px;margin-top:8px}
    #socialGiftControls input{width:90px}
    #socialNote{min-height:20px;margin:8px 0 0}
    #socialNote.error{color:#ff9a8a}
    .socialButton{border:1px solid #4a4460;border-radius:5px;padding:7px 10px;background:#262234;color:#e8edf2;font:600 13px system-ui,sans-serif;cursor:pointer}
    .socialButton:hover{border-color:#7ddc6f;color:#fff1a8}
    .socialButton.primary{border-color:#7ddc6f;color:#fff1a8}
    .socialButton.danger{border-color:#9c4a4a;color:#ff9a8a}
    .socialButton:disabled{opacity:.5;cursor:default}
    .socialField{box-sizing:border-box;border:1px solid #4a4460;border-radius:4px;padding:8px;background:#0e0b14;color:#e8edf2;font:14px system-ui,sans-serif}
    .socialField:focus{outline:2px solid #7ddc6f;outline-offset:1px}
    @media(max-width:620px){#socialOverlay{padding:7px}#socialCard{height:100%}#socialHeader{padding:10px}#socialHeader h2{font-size:15px}#socialContent{flex-direction:column}#socialAuth{box-sizing:border-box}#socialSide{box-sizing:border-box;width:100%;min-width:0;max-height:42%;border-right:0;border-bottom:1px solid #3d3a52;padding:8px;display:grid;grid-template-columns:1fr 1fr;align-content:start;gap:6px}#socialSide>.socialSection{min-width:0}#socialChat{padding:8px}#socialMessages{min-height:90px}}
  `;
  document.head.appendChild(style);
  const overlay = document.createElement('div');
  overlay.id = 'socialOverlay';
  overlay.innerHTML = `
    <section id="socialCard" role="dialog" aria-modal="true" aria-labelledby="socialTitle">
      <header id="socialHeader"><h2 id="socialTitle">EMBERWAKE SOCIAL</h2><span id="socialWallet"></span><button class="socialButton" id="socialClose" type="button">CLOSE</button></header>
      <div id="socialContent">
        <form id="socialAuth">
          <h3>Online account</h3>
          <p>Separate from your local Emberwake save account. Use the same username to find friends.</p>
          <label for="socialUsername">Username</label><input class="socialField socialInput" id="socialUsername" name="username" minlength="3" maxlength="18" pattern="[A-Za-z0-9_-]{3,18}" autocomplete="username" required>
          <label for="socialPassword">Password</label><input class="socialField socialInput" id="socialPassword" name="password" type="password" minlength="8" maxlength="128" autocomplete="current-password" required>
          <div class="socialRow"><button class="socialButton primary" id="socialSignIn" type="submit">SIGN IN</button><button class="socialButton" id="socialRegister" type="button">CREATE ONLINE ACCOUNT</button></div>
          <p>Online activity is shared with accepted friends only. Coins here are separate from arena coins.</p>
        </form>
        <div id="socialMain">
          <aside id="socialSide">
            <section class="socialSection"><h3>ADD A FRIEND</h3><form id="socialAddForm" class="socialForm"><input class="socialField" id="socialAddName" aria-label="Friend username" placeholder="Username" maxlength="18" required><button class="socialButton primary" type="submit">ADD</button></form></section>
            <section class="socialSection"><h3>REQUESTS</h3><div id="socialRequests"></div></section>
            <section class="socialSection"><h3>FRIENDS</h3><div id="socialFriends"></div></section>
            <button class="socialButton" id="socialLogout" type="button">SIGN OUT</button>
          </aside>
          <section id="socialChat">
            <div id="socialChatHeading">Choose a friend to chat.</div>
            <div id="socialMessages" aria-live="polite"></div>
            <form id="socialChatControls"><input class="socialField" id="socialMessageText" type="text" maxlength="500" placeholder="Message your friend..." autocomplete="off" disabled><button class="socialButton primary" type="submit" disabled>SEND</button></form>
            <form id="socialGiftControls"><input class="socialField" id="socialCoinAmount" type="number" min="1" max="10000" value="1" aria-label="Coins to send" disabled><button class="socialButton" type="submit" disabled>SEND COINS</button></form>
          </section>
        </div>
      </div>
      <div id="socialNote" role="status" aria-live="polite"></div>
    </section>`;
  document.body.appendChild(overlay);
  document.getElementById('socialClose').addEventListener('click', socialClose);
  document.getElementById('socialAuth').addEventListener('submit', e => { e.preventDefault(); socialAuthenticate(false); });
  document.getElementById('socialRegister').addEventListener('click', () => socialAuthenticate(true));
  document.getElementById('socialAddForm').addEventListener('submit', e => { e.preventDefault(); socialAddFriend(); });
  document.getElementById('socialChatControls').addEventListener('submit', e => { e.preventDefault(); socialSendMessage(); });
  document.getElementById('socialGiftControls').addEventListener('submit', e => { e.preventDefault(); socialSendCoins(); });
  document.getElementById('socialLogout').addEventListener('click', socialLogout);
  overlay.addEventListener('click', e => { if (e.target === overlay) socialClose(); });
  window.addEventListener('keydown', e => { if (SOCIAL.open && e.key === 'Escape' && !e.target.matches('input')) { e.preventDefault(); socialClose(); } });
}

async function socialApi(path, body, method) {
  const headers = { 'Content-Type': 'application/json' };
  if (SOCIAL.token) headers.Authorization = 'Bearer ' + SOCIAL.token;
  let response;
  try {
    response = await fetch('/api/' + path, {
      method: method || (body === undefined ? 'GET' : 'POST'),
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store'
    });
  } catch (e) {
    throw new Error('Social service unavailable. Open Emberwake from the online service server.');
  }
  let data;
  try { data = await response.json(); } catch (e) { throw new Error('The social service returned an unreadable response.'); }
  if (!response.ok) throw new Error(data && typeof data.error === 'string' ? data.error : 'The social request failed.');
  return data;
}

function socialNote(message, error = false) {
  const el = document.getElementById('socialNote');
  if (!el) return;
  el.textContent = message || '';
  el.classList.toggle('error', !!error);
}

function socialOpen() {
  socialBuildPanel();
  SOCIAL.open = true;
  document.getElementById('socialOverlay').classList.add('open');
  socialNote('');
  if (SOCIAL.token) socialRefresh();
  else {
    const field = document.getElementById('socialUsername');
    if (!field.value && ACCOUNT.active) field.value = ACCOUNT.active.name;
    field.focus();
  }
}

function socialClose() {
  SOCIAL.open = false;
  document.getElementById('socialOverlay')?.classList.remove('open');
}

function socialSetSignedIn() {
  const signedIn = !!SOCIAL.token;
  document.getElementById('socialAuth').style.display = signedIn ? 'none' : 'block';
  document.getElementById('socialMain').style.display = signedIn ? 'flex' : 'none';
  document.getElementById('socialWallet').textContent = signedIn ? `${SOCIAL.state?.coins || 0} EMBER COINS` : '';
}

async function socialAuthenticate(create) {
  if (SOCIAL.busy) return;
  const username = document.getElementById('socialUsername').value.trim();
  const password = document.getElementById('socialPassword').value;
  SOCIAL.busy = true;
  socialNote(create ? 'Creating online account...' : 'Signing in...');
  try {
    const result = await socialApi(create ? 'register' : 'login', { username, password });
    SOCIAL.token = result.token;
    SOCIAL.user = result.user;
    document.getElementById('socialPassword').value = '';
    socialSetSignedIn();
    await socialRefresh();
    await socialPresence();
    socialNote('Signed in as ' + SOCIAL.user.username + '.');
  } catch (e) {
    socialNote(e.message, true);
  } finally { SOCIAL.busy = false; }
}

async function socialLogout() {
  try { await socialApi('logout', {}); }
  catch (e) { socialNote(e.message, true); return; }
  SOCIAL.token = ''; SOCIAL.user = null; SOCIAL.state = null; SOCIAL.chatUser = ''; SOCIAL.lastMessage = 0;
  socialSetSignedIn();
  document.getElementById('socialFriends').replaceChildren();
  document.getElementById('socialRequests').replaceChildren();
  document.getElementById('socialMessages').replaceChildren();
  document.getElementById('socialWallet').textContent = '';
  socialNote('Signed out.');
}

async function socialRefresh() {
  if (!SOCIAL.token || SOCIAL.polling) return;
  SOCIAL.polling = true;
  try {
    SOCIAL.state = await socialApi('social');
    socialSetSignedIn();
    socialRenderLists();
    if (SOCIAL.chatUser) await socialLoadMessages(false);
  } catch (e) {
    socialNote(e.message, true);
    if (/session expired|sign in/i.test(e.message)) {
      SOCIAL.token = ''; SOCIAL.user = null; SOCIAL.state = null; socialSetSignedIn();
    }
  } finally { SOCIAL.polling = false; }
}

function socialRenderLists() {
  const state = SOCIAL.state;
  if (!state) return;
  const requests = document.getElementById('socialRequests');
  const friends = document.getElementById('socialFriends');
  requests.replaceChildren(); friends.replaceChildren();
  for (const username of state.incoming) {
    const row = document.createElement('div'); row.className = 'socialRow';
    const name = document.createElement('span'); name.textContent = username; name.style.flex = '1'; row.appendChild(name);
    for (const [label, accept] of [['ACCEPT', true], ['NO', false]]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'socialButton'; button.textContent = label;
      button.addEventListener('click', () => socialRespond(username, accept)); row.appendChild(button);
    }
    requests.appendChild(row);
  }
  for (const username of state.outgoing) {
    const row = document.createElement('div'); row.className = 'socialRow'; row.textContent = username + ' · pending'; requests.appendChild(row);
  }
  for (const friend of state.friends) {
    const subtitle = friend.online ? `Online${friend.activity ? ' · ' + friend.activity : ''}` : 'Offline';
    const row = document.createElement('div'); row.className = 'socialRow';
    const open = document.createElement('button'); open.type = 'button'; open.className = 'socialButton'; open.textContent = friend.username;
    const sub = document.createElement('small'); sub.textContent = subtitle; open.appendChild(sub);
    open.addEventListener('click', () => socialSelectFriend(friend.username)); row.appendChild(open);
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'socialButton danger'; remove.textContent = '×';
    remove.setAttribute('aria-label', 'Remove ' + friend.username); remove.addEventListener('click', () => socialRemoveFriend(friend.username)); row.appendChild(remove);
    friends.appendChild(row);
  }
  if (!state.incoming.length && !state.outgoing.length) requests.textContent = 'No requests.';
  if (!state.friends.length) friends.textContent = 'No friends yet.';
}

async function socialAddFriend() {
  const input = document.getElementById('socialAddName'), username = input.value.trim();
  try {
    await socialApi('friends/request', { username });
    input.value = ''; await socialRefresh(); socialNote('Friend request sent.');
  } catch (e) { socialNote(e.message, true); }
}

async function socialRespond(username, accept) {
  try {
    await socialApi('friends/respond', { username, accept });
    await socialRefresh(); socialNote(accept ? 'Friend request accepted.' : 'Friend request declined.');
  } catch (e) { socialNote(e.message, true); }
}

async function socialRemoveFriend(username) {
  if (!window.confirm('Remove ' + username + ' from your friends?')) return;
  try {
    await socialApi('friends/remove', { username });
    if (SOCIAL.chatUser === username) socialSelectFriend('');
    await socialRefresh(); socialNote('Friend removed.');
  } catch (e) { socialNote(e.message, true); }
}

function socialSelectFriend(username) {
  SOCIAL.chatUser = username;
  SOCIAL.lastMessage = 0;
  document.getElementById('socialChatHeading').textContent = username ? 'Chat with ' + username : 'Choose a friend to chat.';
  document.getElementById('socialMessages').replaceChildren();
  for (const el of document.querySelectorAll('#socialChatControls input, #socialChatControls button, #socialGiftControls input, #socialGiftControls button')) el.disabled = !username;
  if (username) socialLoadMessages(true);
}

function socialAddMessages(messages) {
  const box = document.getElementById('socialMessages');
  for (const message of messages) {
    if (message.id <= SOCIAL.lastMessage) continue;
    const row = document.createElement('article');
    row.className = 'socialMessage' + (message.from === SOCIAL.user.username ? ' mine' : '');
    const sender = document.createElement('strong'); sender.textContent = message.from;
    const body = document.createElement('p'); body.textContent = message.text;
    row.append(sender, body); box.appendChild(row);
    SOCIAL.lastMessage = Math.max(SOCIAL.lastMessage, message.id);
  }
  box.scrollTop = box.scrollHeight;
}

async function socialLoadMessages(reset) {
  if (!SOCIAL.chatUser) return;
  if (reset) SOCIAL.lastMessage = 0;
  const username = SOCIAL.chatUser;
  try {
    const query = new URLSearchParams({ with: username, after: String(SOCIAL.lastMessage) });
    const result = await socialApi('messages?' + query, undefined, 'GET');
    if (SOCIAL.chatUser !== username) return;
    socialAddMessages(result.messages);
  } catch (e) { socialNote(e.message, true); }
}

async function socialSendMessage() {
  const field = document.getElementById('socialMessageText'), text = field.value.trim();
  if (!SOCIAL.chatUser || !text) return;
  try {
    await socialApi('messages', { to: SOCIAL.chatUser, text });
    field.value = ''; await socialLoadMessages(false);
  } catch (e) { socialNote(e.message, true); }
}

async function socialSendCoins() {
  if (!SOCIAL.chatUser) return;
  const amount = Number(document.getElementById('socialCoinAmount').value);
  const requestKey = window.crypto && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Date.now().toString(36) + Math.random().toString(36).slice(2);
  try {
    const result = await socialApi('coins/send', { to: SOCIAL.chatUser, amount, requestKey });
    SOCIAL.state.coins = result.coins;
    socialSetSignedIn(); await socialLoadMessages(false); socialNote(`Sent ${amount} online Ember coin${amount === 1 ? '' : 's'} to ${SOCIAL.chatUser}.`);
  } catch (e) { socialNote(e.message, true); }
}

function socialActivity() {
  if (G.state === 'play') return WORLD.arena ? 'Playing in an arena' : 'Exploring ' + String(WORLD.name || 'a world').slice(0, 40);
  if (G.state === 'title') return 'At the home screen';
  return 'Playing Emberwake';
}

async function socialPresence() {
  if (!SOCIAL.token) return;
  try { await socialApi('presence', { activity: socialActivity() }); }
  catch (e) { if (/session expired|sign in/i.test(e.message)) { SOCIAL.token = ''; SOCIAL.user = null; SOCIAL.state = null; socialSetSignedIn(); } }
}

setInterval(() => {
  if (SOCIAL.token && document.visibilityState === 'visible') socialPresence();
}, 20_000);

setInterval(() => {
  if (SOCIAL.token && SOCIAL.open && document.visibilityState === 'visible') socialRefresh();
}, 5_000);
