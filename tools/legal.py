#!/usr/bin/env python3
"""Every game's Privacy Policy and Terms of Service, written from one place so the shared clauses stay the same and
each game's own facts (what it stores, which services it uses, what it sells) sit side by side.

    python3 tools/legal.py          writes privacy.html, terms.html (Aha! Brain Puzzles), cozy-*, antfarm-*, messenger-*

The facts come from each game's code (checked 17 October 2026): Aha! Brain Puzzles (game-dev), Cozy Jigsaw Puzzles
(game-puzzle), Ant Farm (ant-bridge) and Last Warning: Tower Defense (tower-defense; "Messenger: Last Warning" until 30 Oct 2026); since 22 October 2026 all four ask
Apple's tracking question (personalised ads for those who allow it) and include Meta's SDK to measure install ads. When a game starts or stops using a
service, change its entry in GAMES, bump EFFECTIVE and run this again. The look is legal.css.
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
EFFECTIVE = "23 October 2026"
EMAIL = "support@wozzly.com"


def A(url, text=None):
    return f'<a href="{url}">{text or url.replace("https://", "")}</a>'


GOOGLE_PRIVACY = A("https://policies.google.com/privacy", "Google Privacy Policy")
GOOGLE_PARTNERS = A("https://policies.google.com/technologies/partner-sites", "How Google uses information from apps that use its services")
FIREBASE_PRIVACY = A("https://firebase.google.com/support/privacy", "Privacy and Security in Firebase")
APPLE_PRIVACY = A("https://www.apple.com/legal/privacy/", "Apple Privacy Policy")
APPLE_EULA = A("https://www.apple.com/legal/internet-services/itunes/dev/stdeula/", "Licensed Application End User License Agreement")
META_PRIVACY = A("https://www.facebook.com/privacy/policy/", "Meta Privacy Policy")
REVENUECAT_PRIVACY = A("https://www.revenuecat.com/privacy", "RevenueCat Privacy Policy")
REFUNDS = A("https://reportaproblem.apple.com", "reportaproblem.apple.com")


# ---------------------------------------------------------------------------------------------------------- the games
GAMES = [
    dict(
        key="aha", name="Aha! Brain Puzzles", icon="icon.svg", accent="#2f6c8f",
        privacy="privacy.html", terms="terms.html", nav=[("index.html", "Support")],
        currency="lamps", items="lamps (used for hints and to open puzzles)",
        analytics=True, ads="att", revenuecat=True, icloud=True, notifications="a daily puzzle reminder",
        age_gate=True, photos=False, share=True, meta=True, privacy_choices=False,
    ),
    dict(
        key="cozy", name="Cozy Jigsaw Puzzles", icon="cozy-icon.png", accent="#b5653a",
        privacy="cozy-privacy.html", terms="cozy-terms.html", nav=[("cozy-credits.html", "Photo credits")],
        currency="hints", items="hints",
        analytics=True, ads="att", revenuecat=True, icloud=False, notifications=None,
        age_gate=False, photos=True, share=False, meta=True, privacy_choices=False,
    ),
    dict(
        key="antfarm", name="Ant Farm", icon="antfarm-icon.png", accent="#3f8a3c",
        privacy="antfarm-privacy.html", terms="antfarm-terms.html", nav=[],
        currency="coins", items="coins, lives and boosters",
        analytics=True, ads="att", revenuecat=False, icloud=True, notifications="a reminder when your lives are full again",
        age_gate=False, photos=False, share=False, meta=True, privacy_choices=False,
    ),
    dict(
        key="messenger", name="Last Warning: Tower Defense", icon="messenger-icon.png", accent="#2563c9",
        privacy="messenger-privacy.html", terms="messenger-terms.html", nav=[("messenger.html", "Support")],
        currency="coins", items="coins, crystals, lives, boosters, paint jobs and Season Pass rewards",
        analytics=True, ads="att", revenuecat=False, icloud=True, notifications=None,
        age_gate=False, photos=False, share=False, meta=True, privacy_choices=True,
    ),
]


# --------------------------------------------------------------------------------------------------------- the page
def page(g, kind, sections, glance):
    title = "Privacy Policy" if kind == "privacy" else "Terms of Service"
    file = g[kind]
    desc = (f"How {g['name']} collects, uses and protects information, and the choices you have." if kind == "privacy"
            else f"The terms that apply when you download and play {g['name']}.")
    nav = g["nav"] + [(g["privacy"], "Privacy"), (g["terms"], "Terms")]
    on = ' class="on"'
    navhtml = "".join(f'<a href="{h}"{on if h == file else ""}>{t}</a>' for h, t in nav)
    home = g["nav"][0][0] if g["nav"] and g["nav"][0][1] == "Support" else g["privacy"]
    number = {sid: i for i, (sid, _, _) in enumerate(sections, 1)}
    toc, body = [], []
    for i, (sid, stitle, shtml) in enumerate(sections, 1):
        shtml = re.sub(r"\[\[sec:([a-z-]+)\]\]", lambda m: f'<a href="#{m.group(1)}">section {number[m.group(1)]}</a>', shtml)
        k = 0

        def sub(m):
            nonlocal k
            k += 1
            return f'<h3><span class="n">{i}.{k}</span>'
        shtml = re.sub(r"<h3>", sub, shtml)
        toc.append(f'<li><a href="#{sid}">{stitle}</a></li>')
        body.append(f'<section id="{sid}">\n<h2><span class="n">{i}.</span>{stitle}</h2>\n{shtml.strip()}\n</section>')
    glancehtml = "".join(f"<li>{x}</li>" for x in glance)
    other = (g["terms"], "Terms of Service") if kind == "privacy" else (g["privacy"], "Privacy Policy")
    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · {html.escape(g['name'])}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="{g['icon']}">
<link rel="stylesheet" href="legal.css">
</head>
<body style="--accent:{g['accent']}">
<header class="bar"><div class="wrap">
<a class="brand" href="{home}"><img src="{g['icon']}" alt="">{html.escape(g['name'])}</a>
<nav>{navhtml}</nav>
</div></header>
<main class="wrap"><article class="doc">
<p class="kicker">{html.escape(g['name'])}</p>
<h1>{title}</h1>
<p class="meta"><b>Effective date:</b> {EFFECTIVE} &nbsp;·&nbsp; <b>Last updated:</b> {EFFECTIVE}</p>
<aside class="glance"><h2>At a glance</h2><ul>{glancehtml}</ul></aside>
<nav class="toc" aria-label="Contents"><h2>Contents</h2><ol>{''.join(toc)}</ol></nav>
{chr(10).join(body)}
<p class="meta" style="margin-top:36px">See also our {A(other[0], other[1])}.</p>
</article></main>
<footer class="foot"><div class="wrap"><span>© 2026 {html.escape(g['name'])}. All rights reserved.</span><nav>{''.join(f'<a href="{h}">{t}</a>' for h, t in nav)}</nav></div></footer>
</body>
</html>
"""
    (ROOT / file).write_text(out)
    print("wrote", file)


def table(head, rows):
    th = "".join(f"<th>{h}</th>" for h in head)
    trs = "".join("<tr>" + "".join(f'<td data-label="{h}">{c}</td>' for h, c in zip(head, r)) + "</tr>" for r in rows)   # (labels: phones stack each row)
    return f'<div class="table"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>'


def ul(items):
    return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"


CONTACT = f"""<div class="contact"><p><strong>Email:</strong> {A('mailto:' + EMAIL, EMAIL)}</p>
<p>Please include the game's name, its version (shown in the game's Settings) and your iPhone or iPad model so we can help quickly.</p></div>"""


# ----------------------------------------------------------------------------------------------------- privacy
def privacy(g):
    n = g["name"]
    ads, analytics, rc, icloud, meta = g["ads"], g["analytics"], g["revenuecat"], g["icloud"], g["meta"]
    S = []

    S.append(("about", "Who we are and what this policy covers", f"""
<p>This Privacy Policy explains how <strong>{n}</strong> (the “Game”) collects, uses, shares and protects information when you
download and play it on an iPhone or iPad. The Game is developed and published by an independent developer (“we”, “us” or
“our”), who decides how the information described here is used and is the data controller for the purposes of data protection
law, such as the EU and UK General Data Protection Regulation (GDPR).</p>
<p>This policy applies to the Game and to its pages on this website. It does not apply to the App Store, to iCloud or to the
services of our partners, which have their own policies (linked in [[sec:partners]]). Please read it together with our
{A(g['terms'], 'Terms of Service')}.</p>
<p>The Game has <strong>no accounts</strong>: it never asks for your name, email address, phone number or password, and we do
not run servers that store information about you.</p>"""))

    # --- what is collected
    rows = []
    stored = {
        "aha": "Your stars, stickers, lamps, settings, the age range you chose, and a record of how each puzzle went (for the “Puzzle stats” screen).",
        "cozy": "Your progress (solved puzzles, puzzles in progress), hints, daily streak, settings and, if you use “My photos”, the square copies of the photos you turned into puzzles.",
        "antfarm": "Your levels, coins, lives, boosters, settings, and a record of each purchase so it is never given twice.",
        "messenger": "Your levels and stars, coins, lives, boosters, medals, paint jobs, Season Pass progress, settings, a record of each purchase so it is never given twice, and a short history of the levels you played (result and time), kept for the game itself.",
    }[g["key"]]
    rows.append(["Game progress and settings", stored + (" Saved on your device and, if you are signed in to iCloud, in your own iCloud account (Apple’s key-value storage)." if icloud else " Saved on your device only."),
                 "To save your game" + (", bring it back after a reinstall and keep it in step on your devices" if icloud else "") + ".",
                 "Nobody: it stays on your device" + (" and in your iCloud account (Apple)" if icloud else "") + ". We never receive it."])
    if analytics:
        what = {
            "aha": "Events such as “puzzle started”, “puzzle solved” (time taken, mistakes, hints used, stars), “puzzle left”, your “Did you enjoy it?” vote, shop and video use, purchases made, shares, the age range you chose and what a watched video earned.",
            "cozy": "Events such as “puzzle started”, “puzzle finished” (the seconds played and hints used), “puzzle left” (how many pieces were placed), hint, shop and video use, purchases made and settings changed, each with the season, level and number of pieces. Never your photos or anything in them.",
            "antfarm": "Events such as “level started”, “level won” (with the seconds and taps it took), “shelf full”, “booster used” and “video watched”, each with the level number and counts.",
            "messenger": "Events such as “level started”, “level won” or “level lost” (with the wave reached and the time spent playing), “booster used”, “video watched”, menus opened, research and purchases made, each with the level number and counts.",
        }[g["key"]]
        rows.append(["Gameplay statistics", what + " With them: a random identifier for the app installation, phone model, iOS and app version, language, approximate country or region (from the IP address) and session times.",
                     "To learn which levels are too hard, too easy or not fun, and to fix problems.", "Google (Firebase Analytics), as our service provider."])
    if ads:
        idfa = (" If you allow tracking (see [[sec:ads]]), also your device’s advertising identifier (IDFA)." if ads == "att" else "")
        rows.append(["Advertising data", "Only when a rewarded video is requested or shown: device and network information (such as device model, iOS version, IP address, language, approximate location derived from the IP address), and how you interacted with the video." + idfa,
                     "To show, measure, cap and pay for the videos you choose to watch, and to prevent fraud.", "Google (AdMob) and the advertising partners it works with."])
    if meta:
        rows.append(["Install and purchase measurement", "When the Game is opened: that it was installed and opened, in-app purchases made (product and price), device and app information (such as device model, iOS and app version, language and time zone) and the IP address." + (" If you allow tracking (see [[sec:ads]]), also your device’s advertising identifier (IDFA)." if ads == "att" else ""),
                     "To learn whether our ads on Facebook and Instagram lead to people installing and enjoying the Game.", "Meta (Facebook SDK)."])
    rows.append(["Purchases", "What you bought and when, and Apple’s transaction records. Apple handles payment; we never see your card, name, email or Apple Account." + (" RevenueCat receives an anonymous identifier created by the app, your purchase history and receipts from Apple, and basic device details." if rc else ""),
                 "To deliver what you bought, prevent double delivery and let you restore purchases.", "Apple" + (" and RevenueCat, as our service provider" if rc else "") + "."])
    if g["photos"]:
        rows.append(["Your photos (“My photos”)", "Only the photos you choose to pick or take. The Game keeps a square, resized copy inside the app on your device.",
                     "To turn your photo into a jigsaw puzzle.", "Nobody. Your photos are never uploaded."])
    rows.append(["Messages you send us", "Your email address and whatever you write, if you contact us.", "To answer you.", "Nobody."])

    collect = f"""<p>The table below lists everything the Game handles. We do not ask for or collect your name, email address (unless you write to
us), contacts, precise location, health data or browsing history.</p>
{table(["Information", "What it is", "Why", "Who receives it"], rows)}"""
    if g["photos"]:
        collect += """<h3>Camera and photo library</h3>
<p>The Game asks to use the camera or your photo library only when you choose to make a puzzle from your own photo, and iOS
asks for your permission first. The Game reads only the photo you pick or take. You can withdraw access at any time in iOS
Settings → Privacy &amp; Security → Photos or Camera.</p>"""
    if g["notifications"]:
        collect += f"""<h3>Notifications</h3>
<p>If you agree, the Game can send {g['notifications']}. iOS asks for your permission first. Reminders are scheduled on your
device itself: nothing is sent to us or anyone else. Turn them off in the Game’s settings or in iOS Settings → Notifications.</p>"""
    if g["share"]:
        collect += """<h3>Sharing a puzzle</h3>
<p>“Challenge a friend” and “Ask someone for help” create a picture of the puzzle and open your device’s share sheet. You
choose who receives it and through which app. We do not receive the picture, your message or the recipient.</p>"""
    if g["age_gate"]:
        collect += """<h3>The “Who’s playing” setting</h3>
<p>The Game does not ask your age at the start. In Settings → Who’s playing, a parent or guardian can choose “Under 13”.
The Game then sends no statistics, never starts the video ad service and shows no video offers (see [[sec:children]]).</p>"""
    S.append(("collect", "Information we collect", collect))

    # --- uses
    uses = ["To run the Game and save your progress" + (" (including across your devices through iCloud)" if icloud else "") + ".",
            "To deliver in-app purchases, prevent them from being given twice and restore them where possible."]
    if ads:
        uses.append("To offer optional rewarded videos, and give you the reward when you watch one.")
    if analytics:
        uses.append("To understand how the Game is played (for example where players get stuck) and improve its levels and features.")
    uses += ["To keep the Game secure and prevent fraud and abuse.",
             "To answer your questions and requests.",
             "To comply with the law and enforce our Terms of Service."]
    S.append(("use", "How we use information", ul(uses) + "<p>We do not use your information to make decisions about you that have legal or similarly significant effects.</p>"))

    # --- legal bases
    bases = [("Performance of a contract", "running the Game, saving your progress and delivering what you buy.")]
    if ads:
        bases.append(("Consent", "where the law requires it (for example in the EEA, the UK and Switzerland), for the advertising partners’ use of your device for ads, collected through Google’s consent form" + (" and, for personalised ads and for Meta’s use of your advertising identifier, Apple’s tracking question" if ads == "att" else "") + ". You can withdraw consent at any time ([[sec:rights]])."))
    if analytics:
        bases.append(("Legitimate interests", "measuring and improving the Game with statistics that do not identify you by name and are not used for advertising" + (", and showing non-personalised rewarded videos that keep the Game free" if ads else "") + "."))
    elif ads:
        bases.append(("Legitimate interests", "showing non-personalised rewarded videos that keep the Game free, and preventing fraud."))
    if meta:
        bases.append(("Legitimate interests", "measuring, in aggregate, whether our ads on Facebook and Instagram work."))
    bases.append(("Legal obligation", "keeping records and responding to lawful requests where the law requires it."))
    S.append(("bases", "Legal bases (EEA, UK and Switzerland)", "<p>Where the GDPR or similar laws apply, we rely on the following legal bases:</p>" +
              ul([f"<strong>{a}</strong>: {b}" for a, b in bases])))

    # --- partners
    prow = [["Apple Inc.", "App Store, In-App Purchase" + (", iCloud key-value storage" if icloud else ""), "Downloads, payments and refunds" + ("; keeps your save in your own iCloud account" if icloud else ""), APPLE_PRIVACY]]
    if ads:
        prow.append(["Google AdMob (Google LLC; Google Ireland Ltd. in the EEA and UK)", "Rewarded video ads and the consent form", "Showing, measuring and paying for the videos you choose to watch", f"{GOOGLE_PRIVACY}; {GOOGLE_PARTNERS}"])
    if analytics:
        prow.append(["Google Analytics for Firebase (Google LLC)", "Gameplay statistics, without the advertising identifier", "Understanding and improving the Game", f"{FIREBASE_PRIVACY}; {GOOGLE_PRIVACY}"])
    if meta:
        prow.append(["Meta Platforms, Inc. (Meta Platforms Ireland Ltd. in the EEA and UK)", "Facebook SDK, app events only", "Measuring our ads on Facebook and Instagram", META_PRIVACY])
    if rc:
        prow.append(["RevenueCat, Inc.", "Purchase records", "Checking and restoring purchases", REVENUECAT_PRIVACY])
    S.append(("partners", "Third-party services", "<p>The Game uses these services. Each processes information as described in its own policy:</p>" +
              table(["Provider", "Service", "Purpose", "Policy"], prow) +
              "<p>We have chosen these services for their privacy and security commitments. We do not use social media sign-in, and the Game has no social media buttons or plug-ins" + (": Meta’s SDK in the Game only measures our ads" if meta else "") + ".</p>"))

    # --- advertising
    if ads:
        rewards = {
            "aha": "free lamps", "cozy": "an extra hint", "antfarm": "an extra life or an extra shelf spot",
            "messenger": "a life, a booster, double coins, another try after a loss or the daily gift",
        }[g["key"]]
        adtext = f"""<p>The Game shows <strong>only rewarded videos that you choose to watch</strong>, for {rewards}. There are no banner ads
and no videos you did not ask for. The videos are served by Google AdMob, which may request them from other advertising
networks it works with (its “ad sources”). Google acts as an independent controller for some of this information; its
policies linked above apply.</p>"""
        if g["age_gate"]:
            adtext += "<p>The video service is never started for players marked “Under 13”, and for everyone else only once videos are first offered.</p>"
        if ads == "npa":
            adtext += """<h3>No tracking, no personalised ads</h3>
<p>The Game does <strong>not</strong> ask to track you, does not use your device’s advertising identifier (IDFA), and asks Google
for non-personalised ads only: videos are chosen from context, not from a profile of your interests. If this ever changes,
the Game will ask you first and this policy will be updated before it does.</p>"""
        else:
            adtext += """<h3>Apple’s tracking question and personalised ads</h3>
<p>The first time the Game opens, current versions show Apple’s App Tracking Transparency question. Your answer decides the kind of videos you see:</p>
<ul><li><strong>Allow</strong>: Google and its partners may use your device’s advertising identifier (IDFA) and information about
your activity to show videos more relevant to you and to measure them. This counts as “tracking” under Apple’s rules.</li>
<li><strong>Ask App Not to Track</strong> (or if you never answer): the IDFA is not available to the Game or its partners, and the
Game asks Google for non-personalised ads only.</li></ul>
<p>You can change your answer at any time in iOS Settings → Privacy &amp; Security → Tracking. The Game plays exactly the same
either way. Ads are limited to content suitable for the Game’s age rating. Apple’s SKAdNetwork may also tell advertisers,
in aggregate and without identifying you, that an ad led to an app being installed.</p>"""
        if meta:
            adtext += """<h3>Measuring our ads on Facebook and Instagram</h3>
<p>We advertise the Game on Facebook and Instagram. To learn which ads lead to installs and purchases, the Game includes
Meta’s SDK, which tells Meta when the Game is installed and opened and about purchases made in it (see [[sec:collect]]). It
offers no Facebook sign-in or sharing and does not read your Facebook account. If you allow tracking, Meta may use your
advertising identifier to measure these ads and to improve the ads it shows, including to you. If you do not, Meta receives
no advertising identifier and the results reach us only in aggregate (through Apple’s SKAdNetwork and Meta’s Aggregated Event
Measurement). Meta acts as an independent controller for some of this information; its policy linked above applies.</p>"""
        adtext += """<h3>Consent in the EEA, the UK and Switzerland</h3>
<p>Where the law requires it, Google’s consent form is shown before any video is requested, and your choices there apply.""" + (
            " You can change them later from “Privacy choices” in the Game’s Settings." if g["privacy_choices"] else " You can review your choices when the form is shown again.") + "</p>"
        S.append(("ads", "Advertising and tracking", adtext))

    # --- sharing
    S.append(("share", "How we share information", """<p><strong>We do not sell your personal information</strong>, and we do not share it with anyone except:</p>""" + ul(
        ["<strong>Service providers and partners</strong> listed in [[sec:partners]], for the purposes described there.",
         "<strong>Apple</strong>, which handles downloads, payments" + (" and your iCloud save" if icloud else "") + ".",
         "<strong>Authorities</strong>, if we are legally required to, or to protect the rights, safety and property of players, the public or us.",
         "<strong>A successor</strong>, if the Game is transferred to another developer or company, in which case this policy continues to apply to information already collected."])))

    # --- transfers, retention, security
    S.append(("transfers", "International data transfers", """<p>Our partners may process information in the United States and other countries whose data protection laws differ from those
where you live. When information from the EEA, the UK or Switzerland is transferred, they rely on recognised safeguards such
as the European Commission’s Standard Contractual Clauses or the EU–U.S. Data Privacy Framework and its UK and Swiss extensions.</p>"""))
    ret = [["Progress and settings", "On your device until you delete the Game" + (" or choose “Start over”" if g["key"] == "aha" else "") + "." + (" The copy in your iCloud account stays there, under Apple’s control and yours, until removed through your iCloud settings." if icloud else "")]]
    if g["photos"]:
        ret.append(["Your photos", "On your device until you remove the photo puzzle or delete the Game."])
    if analytics:
        ret.append(["Gameplay statistics", "Up to 14 months, then deleted automatically by Firebase."])
    if ads:
        ret.append(["Advertising data", "Kept by Google and its partners as described in their policies."])
    if meta:
        ret.append(["Install and purchase measurement", "Kept by Meta as described in its policy."])
    ret.append(["Purchase records", "Kept by Apple" + (" and RevenueCat" if rc else "") + " under their policies, for as long as needed to restore purchases and meet legal obligations."])
    ret.append(["Your emails to us", "Until your question is resolved, and normally deleted within 12 months."])
    S.append(("retention", "Data retention", "<p>We keep information only as long as needed for the purposes above:</p>" + table(["Information", "How long"], ret)))
    S.append(("security", "Security", """<p>Information sent between the Game and our partners travels over encrypted connections (HTTPS). Because the Game has no accounts
and we run no servers holding your data, there is very little about you that could be exposed. Still, no method of transmission
or storage is completely secure, and we cannot guarantee absolute security.</p>"""))

    # --- rights
    choices = []
    if ads == "att":
        choices.append("Allow or stop tracking at any time in iOS Settings → Privacy &amp; Security → Tracking.")
    if ads:
        choices.append("Videos are optional: you can always play without them.")
        choices.append("In the EEA, the UK and Switzerland, change your ad consent choices" + (" from “Privacy choices” in the Game’s Settings." if g["privacy_choices"] else " when Google’s form is shown."))
    if g["age_gate"]:
        choices.append("Choose “Under 13” in Settings → Who’s playing to stop statistics and video ads.")
    if g["notifications"]:
        choices.append("Turn notifications on or off in the Game’s settings or in iOS Settings → Notifications.")
    if g["photos"]:
        choices.append("Allow or remove camera and photo access in iOS Settings → Privacy &amp; Security.")
    choices.append("Delete the Game to remove everything it stored on your device.")
    S.append(("rights", "Your choices and rights", "<h3>Choices in the Game and on your device</h3>" + ul(choices) + f"""
<h3>Your data protection rights</h3>
<p>Depending on where you live (for example in the EEA, the UK, Switzerland, Brazil, Canada or several U.S. states), you may have
the right to <strong>access</strong> the personal information we hold about you, to <strong>correct</strong> or <strong>delete</strong>
it, to <strong>restrict</strong> or <strong>object</strong> to how we use it, to receive it in a <strong>portable</strong> form, and to
<strong>withdraw consent</strong> at any time without affecting earlier processing.</p>
<p>To exercise any of these rights, email {A('mailto:' + EMAIL, EMAIL)}. Because the Game has no accounts and we do not know who
you are, please tell us the game version and roughly when you played so that we (and our partners, where relevant) can help.
We will answer within one month. You also have the right to complain to your local data protection authority.</p>"""))

    # --- US states
    sell = ("We do not sell personal information. When you allow tracking ([[sec:ads]]), the advertising partners’ (Google’s and Meta’s) use of your "
            "advertising identifier and activity for personalised ads may count as “sharing” for cross-context behavioural advertising "
            "or “targeted advertising” under some state laws. You can opt out at any time by turning off tracking in iOS Settings → "
            "Privacy &amp; Security → Tracking, and we do not knowingly allow it for players under 16."
            if ads == "att" else
            "We do not sell personal information, and we do not share it for cross-context behavioural advertising or use it for targeted advertising.")
    cats = ["identifiers (a random app-installation identifier, IP address" + (", and the advertising identifier if you allow tracking" if ads == "att" else "") + ")",
            "commercial information (records of in-app purchases)"]
    if analytics or ads or meta:
        act = [x for x, on in (("gameplay events", analytics), ("interactions with videos", ads), ("app opens and purchases reported to Meta", meta)) if on]
        cats.append("internet or other electronic network activity (" + " and ".join(act) + ")")
        cats.append("approximate geolocation derived from the IP address")
    S.append(("us", "Additional information for U.S. residents", f"""<p>Residents of California and other U.S. states with privacy laws have the rights described in [[sec:rights]] to know about, access,
correct and delete their personal information, and the right not to be discriminated against for using them. In the past
12 months the Game has collected these categories: {', '.join(cats)}, from your device, for the purposes in [[sec:use]] and
shared them only with the providers in [[sec:partners]].</p><p>{sell}</p>
<p>You may use an authorised agent to make a request on your behalf; we may ask for proof of the authorisation.</p>"""))

    # --- children
    if g["age_gate"]:
        kids = """<p>The Game is not directed at children under 13 and is not in the App Store’s Kids category. When a parent or guardian chooses
“Under 13” in Settings → Who’s playing, the Game collects no statistics, never starts the video ad service and shows no video
offers, and sharing a puzzle needs a grown-up’s check first. Meta’s SDK still reports that the Game was opened (see [[sec:ads]]),
without the advertising identifier unless tracking is allowed on the device.</p>"""
    else:
        kids = "<p>The Game is not directed at children under 13 and is not in the App Store’s Kids category." + (
            " Ads are limited to content suitable for the Game’s age rating." if ads == "att" else "") + "</p>"
    kids += f"""<p>We do not knowingly collect personal information from children under 13 (or the higher age set by law where you live).
If you believe a child has given us personal information, for example by email, contact us at {A('mailto:' + EMAIL, EMAIL)} and we will delete it.</p>"""
    S.append(("children", "Children’s privacy", kids))
    S.append(("changes", "Changes to this policy", """<p>We may update this policy as the Game or the law changes. The new version will be posted on this page with a new effective
date. If a change materially affects how your information is used, we will tell you in the Game or in its App Store notes
before it takes effect and, where the law requires it, ask for your consent.</p>"""))
    S.append(("contact", "Contact us", "<p>For questions about this policy or your information, contact the developer of the Game (the data controller):</p>" + CONTACT))

    glance = ["No account, no name, no email: the Game never asks who you are."]
    glance.append("Your progress is saved on your device" + (" and in your own iCloud account" if icloud else "") + "; we never receive it.")
    if analytics:
        glance.append("Anonymous gameplay statistics (Google Firebase, without the advertising identifier) help us improve the levels.")
    else:
        glance.append("No gameplay statistics or analytics are collected.")
    if ads == "npa":
        glance.append("Videos are optional and not personalised. The Game never tracks you or uses your advertising identifier.")
    elif ads == "att":
        glance.append("Videos are optional. Ads are personalised only if you allow tracking in Apple’s question; you can change it in iOS Settings at any time.")
    if meta:
        glance.append("Meta’s SDK tells Meta when the Game is installed and opened, and about purchases, so we can measure our ads on Facebook and Instagram.")
    if g["photos"]:
        glance.append("Photos you turn into puzzles stay on your device and are never uploaded.")
    if g["age_gate"]:
        glance.append("For players marked “Under 13”, the Game sends no statistics and shows no ads.")
    glance.append("Payments are handled by Apple. We never see your card or Apple Account.")
    glance.append("We do not sell your personal information.")
    page(g, "privacy", S, glance)


# ------------------------------------------------------------------------------------------------------- terms
def terms(g):
    n, cur = g["name"], g["currency"]
    S = []
    S.append(("agreement", "Agreement to these Terms", f"""<p>These Terms of Service (the “Terms”) are a binding agreement between you and the independent developer of
<strong>{n}</strong> (“we”, “us” or “our”) for your use of the {n} app (the “Game”) and its pages on this website. By downloading,
installing or playing the Game you accept these Terms. If you do not agree, please do not use the Game.</p>
<p>Our {A(g['privacy'], 'Privacy Policy')} explains how information is handled and forms part of these Terms. Apple’s standard
{APPLE_EULA} also applies to the Game; if it and these Terms conflict, these Terms apply to the extent the law allows.</p>"""))
    if g["age_gate"]:
        age = """<p>You may use the Game if you can form a binding contract where you live. Children may play only with the permission and
supervision of a parent or legal guardian, who accepts these Terms for them and is responsible for their use of the Game,
including purchases. A parent or guardian can choose “Under 13” in Settings → Who’s playing, which switches off statistics,
video ads and unsupervised sharing.</p>"""
    else:
        age = """<p>You may use the Game if you can form a binding contract where you live. If you are under the age of majority, you may use the
Game only with the permission of a parent or legal guardian, who accepts these Terms on your behalf and is responsible for your
use of the Game, including any purchases. The Game is not directed at children under 13.</p>"""
    S.append(("eligibility", "Eligibility and age", age))
    S.append(("licence", "Your licence to use the Game", f"""<p>Subject to these Terms, we grant you a limited, personal, non-exclusive, non-transferable, non-sublicensable and revocable licence
to download and play the Game on Apple devices that you own or control, as permitted by the Usage Rules in Apple’s Media
Services Terms, for your own non-commercial entertainment.</p>
<p>The Game is licensed, not sold. We and our licensors keep all rights not expressly granted to you.</p>"""))
    S.append(("conduct", "Your obligations and prohibited uses", f"""<p>When using the Game you agree to comply with all applicable laws and these Terms. You must not:</p>""" + ul([
        "copy, modify, translate, distribute, sell, rent, lend or sublicense the Game or any part of it;",
        "decompile, reverse-engineer or disassemble the Game, or try to extract its source code, except where the law expressly allows it;",
        f"use cheats, exploits, bots, modified game files or any unauthorised software, or edit or tamper with saved game data, to obtain {cur} or other items, purchases or advantages;",
        "interfere with the Game, the advertising or purchase systems, or the services of our partners, or try to defraud them (for example by faking ad views or purchase receipts);",
        "remove or alter any copyright, trademark or other notices in the Game;",
        "use the Game for any unlawful, harmful or fraudulent purpose.",
    ]) + "<p>If you find a bug that gives an unintended advantage, please tell us rather than exploit it.</p>"))

    vi = {
        "aha": "Lamps are earned by playing, from the daily challenge, from optional videos, or bought in lamp packs, and are used for hints and to open puzzles.",
        "cozy": "Hints are earned by playing, from optional videos, or bought in hint packs, and help you place pieces.",
        "antfarm": "Coins are earned by playing and from optional videos, or bought in coin packs; lives and boosters are earned by playing or bought with coins.",
        "messenger": "Coins, lives, boosters and paint jobs are earned by playing, from medals, chests, the daily gift, the Season Pass and optional videos, or bought. Crystals are earned and spent within a single level.",
    }[g["key"]]
    S.append(("virtual", "Virtual currency and items", f"""<p>The Game includes virtual items such as {g['items']} (“Virtual Items”). {vi}</p>""" + ul([
        "Virtual Items are licensed to you for use in the Game only. You do not own them, and they have no monetary value.",
        "Virtual Items cannot be sold, transferred, exchanged between players, or redeemed for real money, goods or anything of value outside the Game, and we do not refund them except where the law requires.",
        "Consumable Virtual Items are used up when you spend them.",
        "We may manage, regulate, change or remove Virtual Items, their prices and how they are earned, for example to balance the Game, without liability to you, except where the law provides otherwise.",
    ])))

    buy = {
        "aha": [("Consumable", "lamp packs: used up as you spend the lamps; they cannot be restored."),
                ("One-time purchases", "stage packs, “Everything” and special stages: yours to keep, and restorable on your other devices signed in to the same Apple Account. Seasonal stages are offered for a limited time; once bought, you keep them.")],
        "cozy": [("Consumable", "hint packs: used up as you use the hints; they cannot be restored."),
                 ("One-time purchases", "season packs and the “My photos” pack: yours to keep, and restorable with Restore Purchases on your other devices signed in to the same Apple Account.")],
        "antfarm": [("Consumable", "coin packs: the coins are added to your game and used up as you spend them; they cannot be restored on another device, though your coin balance follows your iCloud save."),
                    ("One-time purchase", "the Starter Pack, which can be bought once and is restored with Restore Purchases on your devices signed in to the same Apple Account.")],
        "messenger": [("Consumable", "coin packs, the Starter Pack and the First Deal: their coins and items are added to your game and used up as you spend them; they cannot be restored on another device, though your balance follows your iCloud save."),
                      ("Season Pass", "a one-time purchase for the premium rewards of the season in which you buy it (30 days). It is not a subscription and never renews. Rewards you reach and do not collect are given to you when the season ends."),
                      ("Kept forever", "the Commander Pack, the bundles’ paint jobs and the Galaxy Paint: yours to keep, and restorable with Restore Purchases on your devices signed in to the same Apple Account. A restore gives back the lasting part of a bundle, not its coins.")],
    }[g["key"]]
    free = {"aha": "The Game is free to download and offers optional in-app purchases. The first 15 levels and the daily challenge are free.",
            "cozy": "The Game offers optional in-app purchases.", "antfarm": "The Game is free to play and offers optional in-app purchases.",
            "messenger": "The Game is free to play and offers optional in-app purchases."}[g["key"]]
    S.append(("purchases", "Purchases, payments and refunds", f"""<p>{free} All purchases are made and paid for through Apple’s App Store using Apple’s
In-App Purchase, under Apple’s terms. Prices are shown in the App Store currency for your country before you confirm a purchase,
and may change. There are no subscriptions.</p>""" + ul([f"<strong>{a}</strong>: {b}" for a, b in buy]) + f"""
<p><strong>All sales are final</strong> except as required by law or by Apple’s policies. Refunds are handled by Apple, not by us: you can request one at
{REFUNDS}. If a refund is given, we may remove the Virtual Items or content it paid for. Parents and guardians can control purchases with
iOS Screen Time → Content &amp; Privacy Restrictions.</p>
<p>If a purchase does not arrive, restart the Game and use Restore Purchases, or contact us with the date of the purchase.</p>"""))

    if g["ads"]:
        S.append(("videos", "Optional rewarded videos", """<p>The Game offers short videos from third-party advertisers that you may choose to watch in exchange for a reward. Watching is always
optional. Rewards are given only for videos watched to the end, may be limited in number, and may change. Ads are provided by
third parties (through Google AdMob); we do not control and are not responsible for their content, products or services, and your
dealings with advertisers are solely between you and them. See the """ + A(g['privacy'], 'Privacy Policy') + " for how ads work.</p>"))

    save = "on your device and, if you are signed in to iCloud, in your own iCloud account, so they return after a reinstall and follow you to your other devices" if g["icloud"] else "only on your device"
    S.append(("saves", "Your progress and saved data", f"""<p>Your progress and {cur} are saved {save}. We have no copy of them. If you delete the Game{', choose “Start over”' if g['key'] == 'aha' else ''}{' while not signed in to iCloud' if g['icloud'] else ''} or lose
your device, your progress and earned {cur} may be lost permanently, and we cannot restore them. Purchases that are kept forever can be restored as
described in [[sec:purchases]].</p>"""))

    if g["photos"]:
        S.append(("content", "Your photos", """<p>You keep all rights in the photos you turn into puzzles with “My photos”. They stay on your device and are never uploaded to us or
anyone else. Use only photos you have the right to use, and do not use the feature for unlawful content.</p>
<p>The puzzle photos supplied with the Game belong to their photographers and are used under the Unsplash and Pixabay licences
(see the """ + A("cozy-credits.html", "photo credits") + "). Please do not copy them out of the Game.</p>"))
    if g["share"]:
        S.append(("sharing", "Sharing puzzles", """<p>“Challenge a friend” and “Ask someone for help” share a picture of a puzzle through your device’s share sheet. You choose who receives
it and are responsible for what you send and to whom.</p>"""))

    S.append(("ip", "Intellectual property", f"""<p>The Game and everything in it, including its code, levels, characters, story, artwork, music, sounds, text, names and logos, are owned
by us or our licensors and are protected by copyright, trademark and other laws. Third-party materials are used under their licences.
Except for the licence in [[sec:licence]], nothing in these Terms gives you any right in them.</p>
<p>If you send us ideas or feedback, we may use them freely without any obligation to you.</p>
<p>If you believe something in the Game infringes your copyright, please contact us with the details and we will look into it promptly.</p>"""))
    S.append(("changes-game", "Updates, changes and availability", """<p>We may update the Game at any time to fix problems, change balance, prices, levels or features, or add or remove content, and some
updates may be required to keep playing. We may also stop offering or supporting the Game; if we do, it will keep working on devices
where it is installed for as long as Apple and your device allow, but we cannot promise any particular feature or content will stay
available.</p>"""))
    S.append(("termination", "Suspension and termination", """<p>These Terms apply for as long as you use the Game. You may end them at any time by deleting the Game. If you breach these Terms,
your licence ends automatically and you must stop using the Game and delete it from your devices. Sections
that by their nature should survive (such as virtual items, intellectual property, disclaimers and limitation of liability) survive the end
of these Terms.</p>"""))
    S.append(("warranty", "Disclaimer of warranties", """<p class="caps">The Game is provided “as is” and “as available”. To the fullest extent permitted by law, we disclaim all warranties, express or
implied, including merchantability, fitness for a particular purpose, non-infringement and that the Game will be uninterrupted, error-free
or free of harmful components.</p>
<p>We work hard to make the Game fun and reliable, and nothing in these Terms limits rights you have as a consumer that cannot be excluded by law.</p>"""))
    S.append(("liability", "Limitation of liability", """<p class="caps">To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential or punitive damages,
or for any loss of data, virtual items, profits or goodwill, arising from or related to the Game or these Terms. Our total liability for all
claims is limited to the amount you paid for in-app purchases in the Game during the 12 months before the event giving rise to the claim.</p>
<p>Some places do not allow these exclusions or limits, so they may not fully apply to you. We do not exclude liability for death or personal
injury caused by our negligence, for fraud, or for anything else that cannot be excluded by law.</p>"""))
    S.append(("indemnity", "Indemnity", """<p>To the extent permitted by law, you agree to indemnify us against claims, losses and expenses (including reasonable legal fees) arising from
your breach of these Terms or your misuse of the Game.</p>"""))
    S.append(("apple", "App Store terms", """<p>These terms apply because you obtained the Game from Apple’s App Store:</p>""" + ul([
        "These Terms are between you and us only, not Apple Inc. (“Apple”). We, not Apple, are solely responsible for the Game and its content.",
        "Apple has no obligation to provide maintenance or support for the Game.",
        "If the Game fails to conform to any applicable warranty, you may notify Apple, and Apple will refund the purchase price of the Game (if any) to you. To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the Game.",
        "We, not Apple, are responsible for addressing any claims by you or any third party relating to the Game, including product liability claims, claims that the Game fails to meet any legal or regulatory requirement, and claims under consumer protection, privacy or similar laws.",
        "If a third party claims that the Game or your use of it infringes their intellectual property rights, we, not Apple, are responsible for the investigation, defence, settlement and discharge of that claim.",
        "You confirm that you are not located in a country subject to a U.S. Government embargo or designated as a “terrorist supporting” country, and that you are not on any U.S. Government list of prohibited or restricted parties.",
        "You must comply with any applicable third-party terms (such as your mobile data plan) when using the Game.",
        "Apple and its subsidiaries are third-party beneficiaries of these Terms and, once you accept them, Apple may enforce them against you.",
    ])))
    S.append(("general", "General", ul([
        "<strong>Entire agreement.</strong> These Terms, the Privacy Policy and Apple’s licence terms are the entire agreement between you and us about the Game.",
        "<strong>Severability.</strong> If any part of these Terms is found unenforceable, the rest stays in effect.",
        "<strong>No waiver.</strong> Not enforcing a provision is not a waiver of our right to do so later.",
        "<strong>Assignment.</strong> You may not transfer your rights under these Terms. We may transfer ours, for example if the Game is transferred to another developer or company.",
        "<strong>Disputes.</strong> If you have a problem with the Game, please contact us first so we can try to resolve it informally. Nothing in these Terms limits your right to bring a claim before the courts or consumer bodies of the place where you live, where the law gives you that right.",
    ])))
    S.append(("changes", "Changes to these Terms", """<p>We may update these Terms from time to time. The new version will be posted on this page with a new effective date, and material changes
will be announced in the Game or in its App Store notes before they take effect. If you keep playing after a change takes effect, the updated
Terms apply; if you do not agree, please stop using the Game.</p>"""))
    S.append(("contact", "Contact us", "<p>Questions about these Terms, a purchase or the Game:</p>" + CONTACT))

    glance = ["The Game is licensed to you for personal, non-commercial play.",
              f"{cur.capitalize()} and other virtual items have no money value and cannot be exchanged or transferred.",
              "Purchases are made through Apple; refunds are handled by Apple. There are no subscriptions.",
              "No cheats, bots, modified game files or tampering with saved data."]
    if g["ads"]:
        glance.append("Videos are always optional.")
    glance.append("Your progress is saved " + ("on your device and in your iCloud account." if g["icloud"] else "only on your device; deleting the Game deletes it."))
    page(g, "terms", S, glance)


if __name__ == "__main__":
    for g in GAMES:
        privacy(g)
        terms(g)
