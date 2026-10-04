ok here's the deal right

we have a server, an extension, a website, and a shared library

when you visit the website, you can move your spider around
you can see everyone on the website, and everyone using the extension with the preference worldwide turned on
spiders from the extension should show the url they're coming from?


the extension should occasionally run a spider across the screen. Maybe let's start with website


so, clients can send these message types:
- init: (name) sent on join, name will be the country they're visiting from, or something?
- pos: (x/y pos) debounced mouse position as a percentage of screen size, so this works on any screen size
- chat: (message) send a message to others (server runs a profanity filter on it?)

and server can send these message types:
- init: returns list of current connections (guid, name, pos)[]
- pos: received on pos update (guid, pos)
- chat: received when someone else sends a message (guid, message)
- join: received when someone new joins (guid, name, pos)
- leave: received when someone leaves (guid)


maybe pos messages can be combined somehow? if there are a lot of clients on the page, maybe sending grouped messages






extension preferences:

- world wide (broadcast your cursor location and see other cursors, or defaults to only seeing local spiders)
- infestation (if true, lots of local spiders, and show all worldwide spiders, or default to only a few, every once and a while.)
- showMessages (default true, but can also turn these off)

and a count of how many interlopers are online
also button to spawn a spider?


if an interloper is from the website, maybe we display the country?
if an interloper is from the extension, we can show the site they're on?

the idea is to make the internet feel inhabited
and also to show how worldwide is this web











spider thoughts
so the spider itself should be the center of touches
{
    center: Point = [0, 0];
    touches: Point[] = [];
}



but what's the actual problem I'm solving
lerp points vs px points

I want to be able to create a canvas and pass in a series of points, and it should draw
but updating state and drawing seem contrary?
but the canvas should own its size
and speed/stepping are tied to pixels, not lerp numbers
so I guess 