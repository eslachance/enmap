---
description: >-
  To install Enmap, please read these instructions very carefully, every word is important!
---

# Enmap Installation

Enmap is a wrapper around better-sqlite3, which requires to be built directly on your system. As such, you need to install pre-requisites first. Please follow these instructions _to the letter_. If it's not written here, you probably shouldn't do it unless you know _why_ you're doing it.

## Pre-Requisites

{% hint style="warning" %}
SQLite modules usually only successfully work on LTS versions of node which are even-numbered. This means
it will work on node 12, 14, 16 but will most likely _not_ work on 13, 15, 17. Make sure you have the right version, check this with `node -v`.
{% endhint %}

How to install the pre-requisites depends on your operating system, so see below for instructions:

{% tabs %}
{% tab title="Windows" %}
On Windows, two things are required to install better-sqlite3. Python, and the Visual Studio C++ Build Tools. They are required for any module that is _built_ on the system, which includes sqlite.

To install the necessary prerequisites on Windows, the easiest is to simply run the following commands separately, _under an **administrative** command prompt or powershell:_

```javascript
// First run:
npm i -g --add-python-to-path --vs2015 --production windows-build-tools
// If you get an error here READ THE TEXT ABOVE AND BELOW THIS CODE BLOCK, IT IS IMPORTANT.

// Then run:
npm i -g node-gyp@latest
```

> It's _very important_ that this be run in the **administrative** prompt, and not a regular one.

Once the windows-build-tools are installed \(this might take quite some time, depending on your internet connection\), **close all open command prompts, powershell windows, VSCode, and editors with a built-in console/prompt**. Otherwise, the next command will not work.
{% endtab %}

{% tab title="Linux" %}
On Linux, the pre-requisites are much simpler in a way. A lot of modern systems \(such as Ubuntu, since 16.04\) already come with python pre-installed. For some other systems, you might have to fiddle with it to install python (2 or 3, whichever is easiest). Google will be your friend as is customary with Linux.

As for the C++ build tools, that's installed using the simple command: `sudo apt-get install build-essential` for most debian-based systems. For others, look towards your package manager and specificall "GCC build tools".
{% endtab %}

{% tab title="Mac OS" %}
As of writing this page, MacOS versions seem to all come pre-built with Python on the system. You will, however, need the C++ build tools.

* Install [XCode](https://developer.apple.com/xcode/download/)
* Once XCode is installed, go to **Preferences**, **Downloads**, and install the **Command Line Tools**.

Once installed, you're ready to continue.
{% endtab %}
{% endtabs %}

## Installing Enmap

Once those pre-requisites are installed \(if they're not, scroll up, and _follow the instructions_\), and you've closed all open command prompts, open a new, _normal_ \(not-admin\) command prompt or terminal in your project, then install Enmap using the following command:

```text
npm i enmap
```

This will take a few minutes, as it needs to build better-sqlite3 from source code, and then install enmap itself.  Note that "a few minutes" can be 1 or 30 minutes, it really depends on your hardware and configuration.

If you get any errors, please see the [Troubleshooting Guide](troubleshooting-guide.md). If the guide doesn't help, join the Discord \(link at the top of this page\).
