import json
import os
from app.config import get_settings


def _read_static_file(path: str) -> str:
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    full_path = os.path.join(base, "..", "game-runtime", path)
    if not os.path.exists(full_path):
        return ""
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


def render_game_html(game, api_base: str = None) -> str:
    if api_base is None:
        settings = get_settings()
        api_base = settings.site_url
    """Generate a self-contained HTML file for a shared game."""
    module_js = _read_static_file(f"modules/{game.module_type}.js")
    engine_js = _read_static_file("modules/engine-core.js")
    skin_css = ""
    punishment_config = {}

    try:
        punishment_config = json.loads(game.punishment_config)
    except (json.JSONDecodeError, TypeError):
        pass

    params = {}
    try:
        params = json.loads(game.params_json)
    except (json.JSONDecodeError, TypeError):
        pass

    game_config = {
        "shareCode": game.share_code,
        "title": game.title,
        "moduleType": game.module_type,
        "params": params,
        "skin": skin_css,
        "punishment": {
            "type": game.punishment_type,
            "config": punishment_config,
        },
        "apiBase": api_base,
    }

    config_json = json.dumps(game_config, ensure_ascii=False)
    share_url = f"{api_base}/p/{game.share_code}"
    editor_url = f"{api_base}"

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,maximum-scale=1.0">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>整活工厂 - {game.title}</title>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:100%;height:100%;overflow:hidden;touch-action:manipulation;user-select:none;-webkit-user-select:none;font-family:"PingFang SC","Microsoft YaHei",sans-serif}}
body{{background:#1a1a2e;color:#fff}}
#game-root{{position:relative;width:100%;height:100%;display:flex;flex-direction:column}}
#game-header{{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:rgba(0,0,0,.3);z-index:10}}
#game-header .title{{font-size:16px;font-weight:700}}
#game-header .stats{{display:flex;gap:16px;font-size:14px}}
#game-area{{flex:1;position:relative;overflow:hidden}}
#countdown{{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;font-weight:900;z-index:100;text-shadow:0 0 30px rgba(255,255,255,.5);pointer-events:none}}
#result-overlay{{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.85);display:none;flex-direction:column;align-items:center;justify-content:center;z-index:200;text-align:center;padding:20px}}
#result-overlay.show{{display:flex}}
#result-overlay .result-emoji{{font-size:80px;margin-bottom:16px}}
#result-overlay .result-title{{font-size:28px;font-weight:900;margin-bottom:8px}}
#result-overlay .result-score{{font-size:18px;color:#aaa;margin-bottom:24px}}
#result-overlay .btn{{display:inline-block;padding:12px 28px;border-radius:50px;font-size:16px;font-weight:700;border:none;cursor:pointer;margin:6px;text-decoration:none;color:#fff;transition:transform .15s}}
#result-overlay .btn:active{{transform:scale(.95)}}
.btn-revenge{{background:linear-gradient(135deg,#ff4444,#ff6b35)}}
.btn-share{{background:linear-gradient(135deg,#667eea,#764ba2)}}
.btn-again{{background:linear-gradient(135deg,#11998e,#38ef7d)}}
.shake{{animation:shake .5s ease-in-out}}
@keyframes shake{{0%,100%{{transform:translateX(0)}}25%{{transform:translateX(-10px) rotate(-2deg)}}50%{{transform:translateX(10px) rotate(2deg)}}75%{{transform:translateX(-6px) rotate(-1deg)}}}}
</style>
</head>
<body>
<div id="game-root">
<div id="game-header"><span class="title">{game.title}</span><span class="stats">得分:<span id="score-display">0</span></span></div>
<div id="game-area"></div>
</div>
<div id="countdown"></div>
<div id="result-overlay">
<div class="result-emoji" id="result-emoji"></div>
<div class="result-title" id="result-title"></div>
<div class="result-score" id="result-score"></div>
<div id="result-buttons"></div>
</div>
<script>
{engine_js}
</script>
<script>
{module_js}
</script>
<script>
window.__TROLL_CONFIG__ = {config_json};
(function() {{
var config = window.__TROLL_CONFIG__;
var area = document.getElementById("game-area");
var scoreEl = document.getElementById("score-display");
var countdownEl = document.getElementById("countdown");
var overlay = document.getElementById("result-overlay");
var moduleMap = {{ avoidance: AvoidanceGame, clicker: ClickerGame, match3: Match3Game, quiz: QuizGame }};
var GameClass = moduleMap[config.moduleType];
if (!GameClass) {{ area.innerHTML = '<div style="padding:40px;text-align:center"><h2>游戏模块未找到</h2></div>'; return; }}

var game = new GameClass(area, config.params, config.skin, function(result) {{
    gameResult = result;
    endGame(result);
}});

function showCountdown(cb) {{
    var n=3;
    countdownEl.style.display="block";
    countdownEl.textContent=n;
    var t=setInterval(function() {{
        n--; if(n<=0){{ countdownEl.textContent="GO!"; }}
        else {{ countdownEl.textContent=n; }}
        if(n<0){{ clearInterval(t); countdownEl.style.display="none"; cb(); }}
    }},600);
}}

game.init();
showCountdown(function() {{
    game.start();
    var si = setInterval(function() {{
        var s = game.getState();
        scoreEl.textContent = s.score || 0;
        if (s.state === "ended") clearInterval(si);
    }}, 100);
}});

var gameResult = null;

function endGame(result) {{
    overlay.classList.add("show");
    document.getElementById("result-score").textContent = "得分: " + (result.score||0);

    if (result.result === "win") {{
        document.getElementById("result-emoji").textContent = "🎉";
        document.getElementById("result-title").textContent = "算你厉害！";
        document.getElementById("result-buttons").innerHTML =
            '<a class="btn btn-revenge" href="' + config.apiBase + '/editor?module=' + config.moduleType + '">🤬 做游戏坑回去</a>' +
            '<button class="btn btn-again" onclick="location.reload()">🔄 再来一次</button>';
    }} else {{
        document.getElementById("result-emoji").textContent = "💩";
        document.getElementById("result-title").textContent = "你被整了！哈哈哈！";
        document.body.classList.add("shake");
        setTimeout(function(){{ document.body.classList.remove("shake"); }}, 500);
        document.getElementById("result-buttons").innerHTML =
            '<a class="btn btn-revenge" href="' + config.apiBase + '/editor?module=' + config.moduleType + '">🔥 不服？做个游戏反击！</a>' +
            '<button class="btn btn-again" onclick="location.reload()">🔄 再试一次</button>';
    }}

    try {{
        fetch(config.apiBase + "/api/share/" + config.shareCode + "/play", {{
            method: "POST",
            headers: {{"Content-Type":"application/json"}},
            body: JSON.stringify({{ player_name:"匿名玩家", score:result.score||0, result:result.result, duration_seconds:result.duration||0 }})
        }});
    }} catch(e) {{}}
}};
}})();
</script>
</body>
</html>'''

    output_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "games"
    )
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{game.share_code}.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    return html
